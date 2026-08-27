// src/services/inteligenciaFinanceira.js

// ==========================================
// CALCULAR PREVISÃO DE GASTOS
// ==========================================
export const calcularPrevisaoGastos = (lancamentos, meses = 3) => {
  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()
  
  // Filtrar despesas dos últimos N meses
  let totalGasto = 0
  let totalMeses = 0
  
  for (let i = 1; i <= meses; i++) {
    let mes = mesAtual - i
    let ano = anoAtual
    if (mes < 0) {
      mes += 12
      ano -= 1
    }
    const mesStr = String(mes + 1).padStart(2, '0')
    const anoStr = String(ano)
    
    const gastosMes = lancamentos
      .filter(item => {
        if (!item.data || item.tipo !== 'despesa') return false
        const partes = item.data.split('-')
        return partes[0] === anoStr && partes[1] === mesStr
      })
      .reduce((acc, item) => acc + item.valor, 0)
    
    if (gastosMes > 0) {
      totalGasto += gastosMes
      totalMeses++
    }
  }
  
  const media = totalMeses > 0 ? totalGasto / totalMeses : 0
  const previsao = media * 1.1 // 10% de margem para imprevistos
  
  return {
    media,
    previsao,
    mesesAnalisados: totalMeses,
    previsaoAlta: previsao * 1.1,
    previsaoBaixa: previsao * 0.9
  }
}

// ==========================================
// CALCULAR SCORE DE SAÚDE FINANCEIRA
// ==========================================
export const calcularScoreSaudeFinanceira = (lancamentos, contas, cartoes, metas) => {
  let score = 0
  const detalhes = []
  
  // 1. Receitas vs Despesas (30 pontos)
  const receitas = lancamentos
    .filter(item => item.tipo === 'receita')
    .reduce((acc, item) => acc + item.valor, 0)
  
  const despesas = lancamentos
    .filter(item => item.tipo === 'despesa')
    .reduce((acc, item) => acc + item.valor, 0)
  
  if (receitas > 0) {
    const economia = (receitas - despesas) / receitas
    if (economia >= 0.2) {
      score += 30
      detalhes.push('💰 Economia saudável (20%+)')
    } else if (economia >= 0.1) {
      score += 20
      detalhes.push('💰 Economia razoável (10-20%)')
    } else if (economia >= 0) {
      score += 10
      detalhes.push('💰 Economia baixa (0-10%)')
    } else {
      detalhes.push('⚠️ Despesas maiores que receitas')
    }
  }
  
  // 2. Saldo em contas (20 pontos)
  const saldoTotal = contas.reduce((acc, conta) => acc + (conta.saldoAtual || 0), 0)
  if (saldoTotal > 10000) {
    score += 20
    detalhes.push('🏦 Reserva excelente (R$ 10k+)')
  } else if (saldoTotal > 5000) {
    score += 15
    detalhes.push('🏦 Boa reserva (R$ 5k+)')
  } else if (saldoTotal > 1000) {
    score += 10
    detalhes.push('🏦 Reserva razoável (R$ 1k+)')
  } else {
    detalhes.push('⚠️ Reserva baixa')
  }
  
  // 3. Limite de cartões (20 pontos)
  const totalLimite = cartoes.reduce((acc, cartao) => acc + (cartao.limiteTotal || 0), 0)
  const totalDisponivel = cartoes.reduce((acc, cartao) => acc + (cartao.limiteDisponivel || 0), 0)
  
  if (totalLimite > 0) {
    const percentualUsado = ((totalLimite - totalDisponivel) / totalLimite) * 100
    if (percentualUsado < 30) {
      score += 20
      detalhes.push('💳 Cartões com bom uso (<30%)')
    } else if (percentualUsado < 60) {
      score += 10
      detalhes.push('💳 Uso moderado de cartões (30-60%)')
    } else {
      detalhes.push('⚠️ Limite de cartões muito utilizado (>60%)')
    }
  } else {
    score += 10
    detalhes.push('💳 Nenhum cartão cadastrado')
  }
  
  // 4. Metas (15 pontos)
  const metasAtivas = metas.filter(m => m.status === 'ativo' || m.status === 'em_andamento')
  const metasConcluidas = metas.filter(m => m.status === 'concluida')
  
  if (metasAtivas.length > 0) {
    const progressoTotal = metasAtivas.reduce((acc, m) => acc + (m.progresso || 0), 0)
    const progressoMedio = progressoTotal / metasAtivas.length
    if (progressoMedio >= 50) {
      score += 15
      detalhes.push('🎯 Metas com bom progresso (50%+)')
    } else {
      score += 8
      detalhes.push('🎯 Metas em andamento')
    }
  } else if (metasConcluidas.length > 0) {
    score += 10
    detalhes.push('✅ Metas concluídas!')
  } else {
    detalhes.push('🎯 Cadastre suas metas')
  }
  
  // 5. Regularidade (15 pontos)
  const hoje = new Date()
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const lancamentosMesAtual = lancamentos.filter(item => item.data?.startsWith(mesAtualStr))
  
  if (lancamentosMesAtual.length >= 10) {
    score += 15
    detalhes.push('📊 Controle financeiro ativo (10+ lançamentos)')
  } else if (lancamentosMesAtual.length >= 5) {
    score += 10
    detalhes.push('📊 Controle financeiro regular (5-10 lançamentos)')
  } else if (lancamentosMesAtual.length > 0) {
    score += 5
    detalhes.push('📊 Controle financeiro iniciante')
  } else {
    detalhes.push('📝 Comece a registrar seus lançamentos')
  }
  
  return {
    score: Math.min(score, 100),
    detalhes,
    nivel: score >= 80 ? 'Excelente' :
           score >= 60 ? 'Boa' :
           score >= 40 ? 'Razoável' :
           score >= 20 ? 'Atenção' : 'Crítico',
    cor: score >= 80 ? '#48bb78' :
         score >= 60 ? '#63b3ed' :
         score >= 40 ? '#ed8936' :
         score >= 20 ? '#fc8181' : '#d94a4a'
  }
}

// ==========================================
// GERAR SUGESTÕES DE ECONOMIA
// ==========================================
export const gerarSugestoesEconomia = (lancamentos) => {
  const sugestoes = []
  
  // Filtrar despesas dos últimos 3 meses
  const hoje = new Date()
  const tresMesesAtras = new Date(hoje)
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)
  
  const despesasRecentes = lancamentos.filter(item => {
    if (!item.data || item.tipo !== 'despesa') return false
    return new Date(item.data) >= tresMesesAtras
  })
  
  // Agrupar por categoria
  const categorias = {}
  despesasRecentes.forEach(item => {
    const cat = item.categoria || 'Sem categoria'
    if (!categorias[cat]) categorias[cat] = 0
    categorias[cat] += item.valor
  })
  
  // Ordenar por valor
  const sorted = Object.entries(categorias).sort((a, b) => b[1] - a[1])
  
  // Sugestões baseadas nas categorias mais caras
  if (sorted.length > 0) {
    const maior = sorted[0]
    if (maior[1] > 1000) {
      sugestoes.push({
        categoria: maior[0],
        valor: maior[1],
        sugestao: `💰 Reduza gastos com "${maior[0]}" - representa ${maior[1].toFixed(2)}% do total`,
        prioridade: 'alta'
      })
    }
    
    if (sorted.length > 1) {
      const segundo = sorted[1]
      if (segundo[1] > 500) {
        sugestoes.push({
          categoria: segundo[0],
          valor: segundo[1],
          sugestao: `💡 Considere reduzir gastos com "${segundo[0]}"`,
          prioridade: 'media'
        })
      }
    }
  }
  
  // Sugestão de meta
  if (despesasRecentes.length > 0) {
    const total = despesasRecentes.reduce((acc, item) => acc + item.valor, 0)
    const media = total / despesasRecentes.length
    if (media > 50) {
      sugestoes.push({
        categoria: 'Geral',
        valor: media,
        sugestao: `🎯 Seu ticket médio é R$ ${media.toFixed(2)}. Tente reduzir!`,
        prioridade: 'media'
      })
    }
  }
  
  return sugestoes.slice(0, 3)
}

// ==========================================
// CALCULAR ORÇAMENTO
// ==========================================
export const calcularOrcamento = (lancamentos, previsao) => {
  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()
  const mesStr = String(mesAtual).padStart(2, '0')
  const anoStr = String(anoAtual)
  
  const gastoReal = lancamentos
    .filter(item => {
      if (!item.data || item.tipo !== 'despesa') return false
      const partes = item.data.split('-')
      return partes[0] === anoStr && partes[1] === mesStr
    })
    .reduce((acc, item) => acc + item.valor, 0)
  
  const diferenca = previsao - gastoReal
  const percentual = previsao > 0 ? (gastoReal / previsao) * 100 : 0
  
  return {
    previsao,
    gastoReal,
    diferenca,
    percentual: Math.min(percentual, 100),
    status: percentual > 100 ? 'estourado' :
            percentual > 80 ? 'atenção' : 'ok',
    cor: percentual > 100 ? '#d94a4a' :
         percentual > 80 ? '#ed8936' : '#48bb78'
  }
}