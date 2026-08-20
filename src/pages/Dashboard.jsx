import React, { useState, useEffect } from 'react'
import { Pie } from 'react-chartjs-2'
import Card from '../components/Card'
import GraficoBarras from '../components/GraficoBarras'
import GraficoPizza from '../components/GraficoPizza'
import { buscarLancamentos } from '../firebase/lancamentosService'
import { buscarContas } from '../firebase/contasService'
import { buscarCartoes } from '../firebase/cartoesService'
import { buscarMetas } from '../firebase/metasService'

// ==========================================
// COMPONENTE: Gráfico de Pizza para Subcategorias
// ==========================================
function GraficoPizzaSubcategorias({ dados }) {
  const cores = ['#fc8181', '#f6ad55', '#68d391', '#63b3ed', '#b794f4', '#f687b3', '#4fd1c5', '#fbd38d']

  const data = {
    labels: dados.map(item => item.nome),
    datasets: [
      {
        data: dados.map(item => item.valor),
        backgroundColor: cores.slice(0, dados.length),
        borderWidth: 2,
        borderColor: '#0d1b2a'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255,255,255,0.6)',
          font: { size: 11 }
        }
      }
    }
  }

  return <Pie data={data} options={options} />
}

function Dashboard() {
  const [lancamentos, setLancamentos] = useState([])
  const [contas, setContas] = useState([])
  const [cartoes, setCartoes] = useState([])
  const [metas, setMetas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [saldo, setSaldo] = useState(0)
  const [economiaPercentual, setEconomiaPercentual] = useState(0)

  const [despesasVencidas, setDespesasVencidas] = useState([])
  const [despesasHoje, setDespesasHoje] = useState([])
  const [despesasProximosDias, setDespesasProximosDias] = useState([])
  const [valorTotalVencido, setValorTotalVencido] = useState(0)
  const [valorTotalHoje, setValorTotalHoje] = useState(0)

  const [dadosCategorias, setDadosCategorias] = useState([])
  const [dadosSubcategorias, setDadosSubcategorias] = useState([])

  // ==========================================
  // INDICADORES AVANÇADOS
  // ==========================================
  const [gastosPorMes, setGastosPorMes] = useState([])
  const [categoriaMaisCara, setCategoriaMaisCara] = useState(null)
  const [ticketMedio, setTicketMedio] = useState(0)
  const [previsaoGastos, setPrevisaoGastos] = useState(0)
  const [top5Despesas, setTop5Despesas] = useState([])
  const [velocidadeGastos, setVelocidadeGastos] = useState(0)
  const [receitasPorMes, setReceitasPorMes] = useState([])

  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]
  const proximos7Dias = new Date(hoje)
  proximos7Dias.setDate(proximos7Dias.getDate() + 7)
  const proximos7DiasStr = proximos7Dias.toISOString().split('T')[0]
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarDados = async () => {
    setCarregando(true)
    
    const dadosLancamentos = await buscarLancamentos()
    const dadosContas = await buscarContas()
    const dadosCartoes = await buscarCartoes()
    const dadosMetas = await buscarMetas()
    
    setLancamentos(dadosLancamentos)
    setContas(dadosContas)
    setCartoes(dadosCartoes)
    setMetas(dadosMetas)
    
    const receitas = dadosLancamentos
      .filter(item => item.tipo === 'receita')
      .reduce((acc, item) => acc + item.valor, 0)
    
    const despesas = dadosLancamentos
      .filter(item => item.tipo === 'despesa')
      .reduce((acc, item) => acc + item.valor, 0)
    
    const saldoTotal = receitas - despesas
    const economia = receitas > 0 ? (saldoTotal / receitas) * 100 : 0
    
    setTotalReceitas(receitas)
    setTotalDespesas(despesas)
    setSaldo(saldoTotal)
    setEconomiaPercentual(economia)

    const despesasFiltradas = dadosLancamentos.filter(item => item.tipo === 'despesa')
    
    const vencidas = despesasFiltradas.filter(item => item.data < hojeStr)
    setDespesasVencidas(vencidas)
    setValorTotalVencido(vencidas.reduce((acc, item) => acc + item.valor, 0))
    
    const hojeDespesas = despesasFiltradas.filter(item => item.data === hojeStr)
    setDespesasHoje(hojeDespesas)
    setValorTotalHoje(hojeDespesas.reduce((acc, item) => acc + item.valor, 0))
    
    const proximosDias = despesasFiltradas.filter(item => 
      item.data > hojeStr && item.data <= proximos7DiasStr
    )
    setDespesasProximosDias(proximosDias)

    const catMap = {}
    despesasFiltradas.forEach(item => {
      const cat = item.categoria || 'Sem categoria'
      if (!catMap[cat]) catMap[cat] = 0
      catMap[cat] += item.valor
    })
    setDadosCategorias(Object.entries(catMap).map(([nome, valor]) => ({ nome, valor })))

    const subMap = {}
    despesasFiltradas.forEach(item => {
      const sub = item.subcategoria || 'Sem subcategoria'
      if (!subMap[sub]) subMap[sub] = 0
      subMap[sub] += item.valor
    })
    setDadosSubcategorias(Object.entries(subMap).map(([nome, valor]) => ({ nome, valor })))

    // ==========================================
    // CALCULAR INDICADORES AVANÇADOS
    // ==========================================

    // 1. Gastos por Mês (últimos 6 meses)
    const mesesLabels = []
    const gastosMeses = []
    const receitasMeses = []
    for (let i = 5; i >= 0; i--) {
      const data = new Date(anoAtual, mesAtual - i, 1)
      const mesStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      mesesLabels.push(data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }))
      
      const gastosMes = dadosLancamentos
        .filter(item => item.tipo === 'despesa' && item.data.startsWith(mesStr))
        .reduce((acc, item) => acc + item.valor, 0)
      gastosMeses.push(gastosMes)
      
      const receitasMes = dadosLancamentos
        .filter(item => item.tipo === 'receita' && item.data.startsWith(mesStr))
        .reduce((acc, item) => acc + item.valor, 0)
      receitasMeses.push(receitasMes)
    }
    setGastosPorMes(gastosMeses)
    setReceitasPorMes(receitasMeses)

    // 2. Categoria Mais Cara
    if (dadosCategorias.length > 0) {
      const maisCara = dadosCategorias.reduce((max, cat) => 
        cat.valor > max.valor ? cat : max
      )
      setCategoriaMaisCara(maisCara)
    }

    // 3. Ticket Médio
    const totalDespesasMes = dadosLancamentos
      .filter(item => item.tipo === 'despesa')
      .reduce((acc, item) => acc + item.valor, 0)
    const qtdDespesas = dadosLancamentos.filter(item => item.tipo === 'despesa').length
    setTicketMedio(qtdDespesas > 0 ? totalDespesasMes / qtdDespesas : 0)

    // 4. Previsão de Gastos (média dos últimos 3 meses * 1.1)
    const ultimos3Meses = []
    for (let i = 1; i <= 3; i++) {
      const data = new Date(anoAtual, mesAtual - i, 1)
      const mesStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const gastos = dadosLancamentos
        .filter(item => item.tipo === 'despesa' && item.data.startsWith(mesStr))
        .reduce((acc, item) => acc + item.valor, 0)
      ultimos3Meses.push(gastos)
    }
    const media3Meses = ultimos3Meses.reduce((acc, val) => acc + val, 0) / ultimos3Meses.length
    setPrevisaoGastos(media3Meses * 1.1)

    // 5. Top 5 Despesas do Mês
    const mesStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}`
    const despesasMes = dadosLancamentos
      .filter(item => item.tipo === 'despesa' && item.data.startsWith(mesStr))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
    setTop5Despesas(despesasMes)

    // 6. Velocidade de Gastos (média por dia no mês)
    const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate()
    const totalGastoMes = dadosLancamentos
      .filter(item => item.tipo === 'despesa' && item.data.startsWith(mesStr))
      .reduce((acc, item) => acc + item.valor, 0)
    setVelocidadeGastos(diasNoMes > 0 ? totalGastoMes / diasNoMes : 0)

    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // ==========================================
  // FORMATADORES
  // ==========================================
  const formatarMoeda = (valor) => {
    return `R$ ${(valor || 0).toFixed(2).replace('.', ',')}`
  }

  const formatarData = (data) => {
    if (!data) return '-'
    const partes = data.split('-')
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  const getBandeiraEmoji = (bandeira) => {
    const bandeiras = {
      visa: '💳',
      mastercard: '💳',
      'american express': '💳',
      elo: '💳',
      hipercard: '💳',
      outro: '💳'
    }
    return bandeiras[bandeira?.toLowerCase()] || '💳'
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'concluida': return '✅ Concluída'
      case 'atrasada': return '⚠️ Atrasada'
      default: return '🔄 Em andamento'
    }
  }

  return (
    <div style={{ 
      padding: '0 10px',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {/* TÍTULO */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ 
          fontSize: 'clamp(20px, 4vw, 28px)', 
          color: '#ffffff',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          📊 Visão Geral
        </h2>
        <p style={{ 
          color: 'rgba(255,255,255,0.5)', 
          fontSize: 'clamp(12px, 2vw, 14px)'
        }}>
          {carregando ? 'Carregando...' : `${lancamentos.length} lançamento(s) · ${contas.length} conta(s) · ${cartoes.length} cartão(ões) · ${metas.length} meta(s)`}
        </p>
      </div>

      {/* ==========================================
          RESUMO FINANCEIRO (4 CARDS NO TOPO)
          ========================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(45,138,78,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(45,138,78,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Total Receitas</p>
          <p style={{ color: '#2d8a4e', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(totalReceitas)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(217,74,74,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(217,74,74,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Total Despesas</p>
          <p style={{ color: '#d94a4a', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(totalDespesas)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(58,122,189,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(58,122,189,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Saldo</p>
          <p style={{ color: saldo >= 0 ? '#2d8a4e' : '#d94a4a', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(saldo)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(159,122,234,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(159,122,234,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Economia</p>
          <p style={{ color: '#9f7aea', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: 0 }}>
            {carregando ? '...' : `${economiaPercentual.toFixed(1)}%`}
          </p>
        </div>
      </div>

      {/* ==========================================
          CARDS SUPERIORES (Score Geral, Saldo Total, Contas, Despesas Pendentes)
          ========================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <Card 
          titulo="SCORE GERAL" 
          valor={carregando ? '...' : `${economiaPercentual.toFixed(2)}%`}
          subtitulo="▲ +0.00 pp vs. ant."
          cor="#2d8a4e"
          icone="📊"
        />
        <Card 
          titulo="SALDO TOTAL" 
          valor={carregando ? '...' : formatarMoeda(saldo)}
          subtitulo={`${lancamentos.length} movimentações`}
          cor="#3a7abd"
          icone="💰"
        />
        <Card 
          titulo="CONTAS ATIVAS" 
          valor={carregando ? '...' : contas.filter(c => c.status === 'ativo').length}
          subtitulo={`${contas.filter(c => c.status === 'inativo').length} inativas`}
          cor="#9f7aea"
          icone="🏦"
        />
        <Card 
          titulo="DESPESAS PENDENTES" 
          valor={carregando ? '...' : formatarMoeda(valorTotalVencido + valorTotalHoje)}
          subtitulo={`${despesasVencidas.length} vencidas · ${despesasHoje.length} hoje`}
          cor={valorTotalVencido > 0 ? '#d94a4a' : '#ed8936'}
          icone="⏰"
        />
      </div>

      {/* ==========================================
          INDICADORES AVANÇADOS
          ========================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
            🏷️ Categoria Mais Cara
          </p>
          <p style={{ color: '#fff', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: '600', margin: 0 }}>
            {carregando ? '...' : categoriaMaisCara?.nome || 'Nenhuma'}
          </p>
          <p style={{ color: '#fc8181', fontSize: '13px', margin: '2px 0 0 0' }}>
            {carregando ? '...' : formatarMoeda(categoriaMaisCara?.valor || 0)}
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
            🎫 Ticket Médio
          </p>
          <p style={{ color: '#fff', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: '600', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(ticketMedio)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '2px 0 0 0' }}>
            por lançamento
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
            📈 Previsão de Gastos
          </p>
          <p style={{ color: '#fff', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: '600', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(previsaoGastos)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '2px 0 0 0' }}>
            próximo mês (estimativa)
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
            ⚡ Velocidade de Gastos
          </p>
          <p style={{ color: '#fff', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: '600', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(velocidadeGastos)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '2px 0 0 0' }}>
            por dia (média)
          </p>
        </div>
      </div>

      {/* ==========================================
          CONTAS E SALDOS
          ========================================== */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          fontSize: 'clamp(12px, 2vw, 14px)', 
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '600',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          💰 Contas e Saldos
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '10px'
        }}>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', gridColumn: '1/-1', textAlign: 'center' }}>
              Carregando contas...
            </p>
          ) : contas.filter(c => c.status === 'ativo').length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', gridColumn: '1/-1', textAlign: 'center' }}>
              Nenhuma conta ativa cadastrada
            </p>
          ) : (
            contas.filter(c => c.status === 'ativo').map(conta => (
              <div key={conta.id} style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '10px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: conta.cor || '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  {conta.logo || '🏦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    color: '#fff', 
                    fontSize: 'clamp(11px, 1.5vw, 13px)', 
                    fontWeight: '500',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conta.nomeExibicao || conta.instituicao}
                  </p>
                  <p style={{ 
                    color: (conta.saldoAtual || 0) >= 0 ? '#2d8a4e' : '#d94a4a',
                    fontSize: 'clamp(13px, 2vw, 15px)',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {formatarMoeda(conta.saldoAtual || 0)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ==========================================
          CARTÕES DE CRÉDITO
          ========================================== */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          fontSize: 'clamp(12px, 2vw, 14px)', 
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '600',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          💳 Cartões de Crédito
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '10px'
        }}>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', gridColumn: '1/-1', textAlign: 'center' }}>
              Carregando cartões...
            </p>
          ) : cartoes.filter(c => c.status === 'ativo').length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', gridColumn: '1/-1', textAlign: 'center' }}>
              Nenhum cartão cadastrado
            </p>
          ) : (
            cartoes.filter(c => c.status === 'ativo').map(cartao => (
              <div key={cartao.id} style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#1a2b4a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  {getBandeiraEmoji(cartao.bandeira)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    color: '#fff', 
                    fontSize: 'clamp(11px, 1.5vw, 13px)', 
                    fontWeight: '500',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {cartao.nome}
                  </p>
                  <p style={{ 
                    color: '#2d8a4e',
                    fontSize: 'clamp(12px, 2vw, 14px)',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {formatarMoeda(cartao.limiteDisponivel || cartao.limiteTotal)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ==========================================
          METAS FINANCEIRAS
          ========================================== */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          fontSize: 'clamp(12px, 2vw, 14px)', 
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '600',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🎯 Metas Financeiras
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '10px'
        }}>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', gridColumn: '1/-1', textAlign: 'center' }}>
              Carregando metas...
            </p>
          ) : metas.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', gridColumn: '1/-1', textAlign: 'center' }}>
              Nenhuma meta cadastrada
            </p>
          ) : (
            metas.slice(0, 4).map(meta => {
              const progresso = meta.progresso || 0
              const statusText = getStatusText(meta.status)
              
              return (
                <div key={meta.id} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${meta.cor || '#4299e1'}`
                }}>
                  <p style={{ 
                    color: '#fff', 
                    fontSize: 'clamp(11px, 1.5vw, 13px)', 
                    fontWeight: '500',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {meta.nome}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                      {progresso.toFixed(0)}%
                    </span>
                    <span style={{ 
                      color: meta.status === 'concluida' ? '#48bb78' : meta.status === 'atrasada' ? '#fc8181' : '#4299e1',
                      fontSize: '9px',
                      fontWeight: '500'
                    }}>
                      {statusText}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    marginTop: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(progresso, 100)}%`,
                      height: '100%',
                      backgroundColor: meta.cor || '#4299e1',
                      borderRadius: '2px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ==========================================
          TOP 5 DESPESAS DO MÊS
          ========================================== */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          fontSize: 'clamp(12px, 2vw, 14px)', 
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '600',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🔥 Top 5 Despesas do Mês
        </h3>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Carregando...</p>
        ) : top5Despesas.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Nenhuma despesa neste mês</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '8px'
          }}>
            {top5Despesas.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '10px 14px',
                borderRadius: '6px',
                borderLeft: `3px solid ${index === 0 ? '#fc8181' : index === 1 ? '#f6ad55' : '#63b3ed'}`
              }}>
                <div>
                  <span style={{ color: '#fff', fontSize: '14px' }}>
                    {index + 1}. {item.descricao}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginLeft: '10px' }}>
                    {item.categoria}
                  </span>
                </div>
                <span style={{ color: '#fc8181', fontWeight: '600', fontSize: '14px' }}>
                  {formatarMoeda(item.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          DESPESAS PENDENTES
          ========================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(217,74,74,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(217,74,74,0.2)'
        }}>
          <h4 style={{ color: '#d94a4a', fontSize: 'clamp(11px, 1.5vw, 13px)', margin: '0 0 4px 0' }}>
            🔴 Vencidas
          </h4>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Carregando...</p>
          ) : despesasVencidas.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(11px, 1.5vw, 13px)' }}>
              Nenhuma despesa vencida ✅
            </p>
          ) : (
            <div>
              <p style={{ color: '#d94a4a', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: '0' }}>
                {formatarMoeda(valorTotalVencido)}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '4px 0 0 0' }}>
                {despesasVencidas.length} despesa(s) vencida(s)
              </p>
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: 'rgba(237,137,54,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(237,137,54,0.2)'
        }}>
          <h4 style={{ color: '#ed8936', fontSize: 'clamp(11px, 1.5vw, 13px)', margin: '0 0 4px 0' }}>
            🟡 Vencem Hoje
          </h4>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Carregando...</p>
          ) : despesasHoje.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(11px, 1.5vw, 13px)' }}>
              Nenhuma despesa hoje ✅
            </p>
          ) : (
            <div>
              <p style={{ color: '#ed8936', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: '0' }}>
                {formatarMoeda(valorTotalHoje)}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '4px 0 0 0' }}>
                {despesasHoje.length} despesa(s) para hoje
              </p>
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: 'rgba(58,122,189,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(58,122,189,0.2)'
        }}>
          <h4 style={{ color: '#3a7abd', fontSize: 'clamp(11px, 1.5vw, 13px)', margin: '0 0 4px 0' }}>
            🔵 Próximos 7 Dias
          </h4>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Carregando...</p>
          ) : despesasProximosDias.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(11px, 1.5vw, 13px)' }}>
              Nenhuma despesa nos próximos dias ✅
            </p>
          ) : (
            <div>
              <p style={{ color: '#3a7abd', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: '0' }}>
                {formatarMoeda(despesasProximosDias.reduce((acc, item) => acc + item.valor, 0))}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '4px 0 0 0' }}>
                {despesasProximosDias.length} despesa(s) programadas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          GRÁFICOS
          ========================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '15px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          height: 'clamp(220px, 40vh, 280px)'
        }}>
          <h3 style={{ 
            fontSize: 'clamp(11px, 1.5vw, 13px)', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📊 Gastos por Categoria
          </h3>
          {carregando ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
            </div>
          ) : dadosCategorias.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Nenhum dado disponível</p>
            </div>
          ) : (
            <GraficoPizza lancamentos={lancamentos} />
          )}
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '15px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          height: 'clamp(220px, 40vh, 280px)'
        }}>
          <h3 style={{ 
            fontSize: 'clamp(11px, 1.5vw, 13px)', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📊 Gastos por Subcategoria
          </h3>
          {carregando ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
            </div>
          ) : dadosSubcategorias.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Nenhum dado disponível</p>
            </div>
          ) : (
            <GraficoPizzaSubcategorias dados={dadosSubcategorias} />
          )}
        </div>
      </div>

      {/* ==========================================
          GRÁFICO DE EVOLUÇÃO
          ========================================== */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        height: 'clamp(220px, 40vh, 280px)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          fontSize: 'clamp(11px, 1.5vw, 13px)', 
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '600',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          📈 Evolução dos Scores (Receitas x Despesas)
        </h3>
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
          </div>
        ) : lancamentos.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Nenhum lançamento para exibir</p>
          </div>
        ) : (
          <GraficoBarras lancamentos={lancamentos} />
        )}
      </div>
    </div>
  )
}

export default Dashboard