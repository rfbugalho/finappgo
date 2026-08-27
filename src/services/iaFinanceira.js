// src/services/iaFinanceira.js

// ==========================================
// REGRESSÃO LINEAR
// ==========================================
export const regressaoLinear = (dados) => {
  // dados: array de objetos com { x, y }
  // x = índice (0, 1, 2, ...)
  // y = valor do gasto
  
  const n = dados.length
  if (n < 3) return null
  
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  
  dados.forEach((d) => {
    sumX += d.x
    sumY += d.y
    sumXY += d.x * d.y
    sumX2 += d.x * d.x
  })
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return { slope, intercept }
}

// ==========================================
// PREVER GASTOS POR CATEGORIA
// ==========================================
export const preverGastosPorCategoria = (lancamentos, meses = 3) => {
  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()
  
  // Agrupar despesas por categoria
  const categorias = {}
  lancamentos.forEach(item => {
    if (item.tipo !== 'despesa' || !item.categoria) return
    const cat = item.categoria
    if (!categorias[cat]) categorias[cat] = []
    
    const data = new Date(item.data)
    const mes = data.getMonth()
    const ano = data.getFullYear()
    const chave = `${ano}-${String(mes + 1).padStart(2, '0')}`
    
    const existe = categorias[cat].find(d => d.mes === chave)
    if (existe) {
      existe.valor += item.valor
    } else {
      categorias[cat].push({ mes: chave, valor: item.valor, data: data })
    }
  })
  
  // Para cada categoria, fazer previsão
  const previsoes = {}
  Object.keys(categorias).forEach(cat => {
    const dados = categorias[cat]
    
    // Ordenar por data
    dados.sort((a, b) => a.data - b.data)
    
    // Pegar últimos 6 meses
    const ultimos6 = dados.slice(-6)
    
    if (ultimos6.length < 3) {
      previsoes[cat] = {
        categoria: cat,
        historico: ultimos6.map(d => ({ mes: d.mes, valor: d.valor })),
        previsoes: [],
        tendencia: 'insuficiente'
      }
      return
    }
    
    // Preparar dados para regressão
    const dadosRegressao = ultimos6.map((d, index) => ({
      x: index,
      y: d.valor
    }))
    
    const resultado = regressaoLinear(dadosRegressao)
    
    if (!resultado) {
      previsoes[cat] = {
        categoria: cat,
        historico: ultimos6.map(d => ({ mes: d.mes, valor: d.valor })),
        previsoes: [],
        tendencia: 'insuficiente'
      }
      return
    }
    
    // Gerar previsões para os próximos meses
    const previsoesMeses = []
    const ultimoIndice = dadosRegressao.length - 1
    
    for (let i = 1; i <= meses; i++) {
      const x = ultimoIndice + i
      const y = resultado.slope * x + resultado.intercept
      
      // Calcular mês/ano futuro
      const ultimaData = ultimos6[ultimos6.length - 1].data
      const dataPrev = new Date(ultimaData)
      dataPrev.setMonth(dataPrev.getMonth() + i)
      const mesPrev = `${dataPrev.getFullYear()}-${String(dataPrev.getMonth() + 1).padStart(2, '0')}`
      
      previsoesMeses.push({
        mes: mesPrev,
        valor: Math.max(y, 0), // Não pode ser negativo
        tendencia: y > ultimos6[ultimos6.length - 1].valor ? 'alta' : 'baixa'
      })
    }
    
    // Calcular tendência
    const slope = resultado.slope
    let tendencia = 'estavel'
    if (slope > 50) tendencia = 'crescente'
    else if (slope < -50) tendencia = 'decrescente'
    
    previsoes[cat] = {
      categoria: cat,
      historico: ultimos6.map(d => ({ mes: d.mes, valor: d.valor })),
      previsoes: previsoesMeses,
      tendencia: tendencia,
      slope: slope
    }
  })
  
  return previsoes
}

// ==========================================
// DETECTAR ANOMALIAS
// ==========================================
export const detectarAnomalias = (lancamentos) => {
  // Filtrar despesas
  const despesas = lancamentos.filter(item => item.tipo === 'despesa')
  
  if (despesas.length < 10) {
    return []
  }
  
  // Calcular média e desvio padrão por categoria
  const categorias = {}
  despesas.forEach(item => {
    const cat = item.categoria || 'Sem categoria'
    if (!categorias[cat]) categorias[cat] = []
    categorias[cat].push(item.valor)
  })
  
  const anomalias = []
  
  Object.keys(categorias).forEach(cat => {
    const valores = categorias[cat]
    
    // Calcular média
    const media = valores.reduce((acc, v) => acc + v, 0) / valores.length
    
    // Calcular desvio padrão
    const variancia = valores.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / valores.length
    const desvioPadrao = Math.sqrt(variancia)
    
    // Limite para anomalia (2 desvios padrão)
    const limiteSuperior = media + 2 * desvioPadrao
    const limiteInferior = media - 2 * desvioPadrao
    
    // Verificar se há gastos fora do padrão
    despesas.forEach(item => {
      if (item.categoria !== cat) return
      if (item.valor > limiteSuperior || item.valor < limiteInferior) {
        anomalias.push({
          ...item,
          categoria: cat,
          media: media,
          desvioPadrao: desvioPadrao,
          limiteSuperior: limiteSuperior,
          limiteInferior: limiteInferior,
          tipo: item.valor > limiteSuperior ? 'acima' : 'abaixo'
        })
      }
    })
  })
  
  return anomalias
}

// ==========================================
// GERAR ORÇAMENTO INTELIGENTE
// ==========================================
export const gerarOrcamentoInteligente = (lancamentos, previsoes) => {
  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()
  const mesStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}`
  
  // Gasto real do mês atual
  const gastoReal = lancamentos
    .filter(item => {
      if (item.tipo !== 'despesa' || !item.data) return false
      return item.data.startsWith(mesStr)
    })
    .reduce((acc, item) => acc + item.valor, 0)
  
  // Previsão para o mês atual (somar todas as categorias)
  let previsaoTotal = 0
  Object.keys(previsoes).forEach(cat => {
    const prev = previsoes[cat]
    if (prev.previsoes && prev.previsoes.length > 0) {
      // Pegar a primeira previsão (próximo mês)
      previsaoTotal += prev.previsoes[0].valor || 0
    }
  })
  
  // Se não tiver previsão, usar média dos últimos 3 meses
  if (previsaoTotal === 0) {
    const ultimos3Meses = []
    for (let i = 1; i <= 3; i++) {
      let mes = mesAtual - i
      let ano = anoAtual
      if (mes < 0) {
        mes += 12
        ano -= 1
      }
      const mesStr2 = `${ano}-${String(mes + 1).padStart(2, '0')}`
      const gastos = lancamentos
        .filter(item => item.tipo === 'despesa' && item.data?.startsWith(mesStr2))
        .reduce((acc, item) => acc + item.valor, 0)
      ultimos3Meses.push(gastos)
    }
    previsaoTotal = ultimos3Meses.reduce((acc, v) => acc + v, 0) / ultimos3Meses.filter(m => m > 0).length || 0
  }
  
  // Categorias com maior previsão
  const categoriasPrev = Object.keys(previsoes).map(cat => ({
    categoria: cat,
    previsao: previsoes[cat].previsoes?.[0]?.valor || 0,
    tendencia: previsoes[cat].tendencia || 'estavel',
    historico: previsoes[cat].historico || []
  }))
  
  categoriasPrev.sort((a, b) => b.previsao - a.previsao)
  
  const top5Categorias = categoriasPrev.slice(0, 5)
  
  return {
    mes: mesStr,
    gastoReal: gastoReal,
    previsaoTotal: previsaoTotal,
    status: gastoReal > previsaoTotal ? 'estourado' : 'ok',
    diferenca: previsaoTotal - gastoReal,
    percentual: previsaoTotal > 0 ? (gastoReal / previsaoTotal) * 100 : 0,
    top5Categorias: top5Categorias,
    sugestao: gastoReal > previsaoTotal 
      ? '⚠️ Seus gastos estão acima da previsão. Reveja suas despesas.' 
      : '✅ Seus gastos estão dentro da previsão. Continue assim!'
  }
}