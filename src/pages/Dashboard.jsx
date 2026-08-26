import React, { useState, useEffect } from 'react'
import { Pie } from 'react-chartjs-2'
import Card from '../components/Card'
import GraficoBarras from '../components/GraficoBarras'
import GraficoPizza from '../components/GraficoPizza'
import { buscarLancamentos } from '../firebase/lancamentosService'
import { buscarContas } from '../firebase/contasService'
import { buscarCartoes } from '../firebase/cartoesService'
import { buscarMetas } from '../firebase/metasService'
import { gerarNotificacoesAutomaticas } from '../firebase/notificacoesService'
import { formatarMoeda } from '../utils/formatters'

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
  // ==========================================
  // ESTADOS PRINCIPAIS
  // ==========================================
  const [lancamentos, setLancamentos] = useState([])
  const [lancamentosFiltrados, setLancamentosFiltrados] = useState([])
  const [contas, setContas] = useState([])
  const [cartoes, setCartoes] = useState([])
  const [metas, setMetas] = useState([])
  const [carregando, setCarregando] = useState(true)

  // ==========================================
  // ESTADOS DOS FILTROS
  // ==========================================
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    tipo: 'todos'
  })

  // ==========================================
  // ESTADOS DOS INDICADORES
  // ==========================================
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
  // ESTADOS DOS INDICADORES AVANÇADOS
  // ==========================================
  const [categoriaMaisCara, setCategoriaMaisCara] = useState(null)
  const [ticketMedio, setTicketMedio] = useState(0)
  const [previsaoGastos, setPrevisaoGastos] = useState(0)
  const [velocidadeGastos, setVelocidadeGastos] = useState(0)
  const [top5Despesas, setTop5Despesas] = useState([])
  const [rankingCategorias, setRankingCategorias] = useState([])

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
    
    setCarregando(false)
  }

  // ==========================================
  // APLICAR FILTROS
  // ==========================================
  const aplicarFiltros = () => {
    let dados = [...lancamentos]

    const mesStr = String(filtros.mes).padStart(2, '0')
    const anoStr = String(filtros.ano)
    dados = dados.filter(item => {
      if (!item.data) return false
      const partes = item.data.split('-')
      return partes[0] === anoStr && partes[1] === mesStr
    })

    if (filtros.tipo !== 'todos') {
      dados = dados.filter(item => item.tipo === filtros.tipo)
    }

    setLancamentosFiltrados(dados)

    // ==========================================
    // CALCULAR INDICADORES DO PERÍODO
    // ==========================================
    const receitas = dados
      .filter(item => item.tipo === 'receita')
      .reduce((acc, item) => acc + item.valor, 0)
    
    const despesas = dados
      .filter(item => item.tipo === 'despesa')
      .reduce((acc, item) => acc + item.valor, 0)
    
    const saldoTotal = receitas - despesas
    const economia = receitas > 0 ? (saldoTotal / receitas) * 100 : 0
    
    setTotalReceitas(receitas)
    setTotalDespesas(despesas)
    setSaldo(saldoTotal)
    setEconomiaPercentual(economia)

    // Despesas do período filtrado
    const despesasFiltradas = dados.filter(item => item.tipo === 'despesa')
    
    // Despesas vencidas (data < hoje E status != pago)
    const vencidas = despesasFiltradas.filter(item => {
      const estaVencida = item.data < hojeStr
      const naoPaga = item.statusPagamento !== 'pago'
      return estaVencida && naoPaga
    })
    setDespesasVencidas(vencidas)
    setValorTotalVencido(vencidas.reduce((acc, item) => acc + item.valor, 0))
    
    // Despesas de hoje
    const hojeDespesas = despesasFiltradas.filter(item => item.data === hojeStr && item.statusPagamento !== 'pago')
    setDespesasHoje(hojeDespesas)
    setValorTotalHoje(hojeDespesas.reduce((acc, item) => acc + item.valor, 0))
    
    // Despesas dos próximos 7 dias
    const proximosDias = despesasFiltradas.filter(item => 
      item.data > hojeStr && item.data <= proximos7DiasStr && item.statusPagamento !== 'pago'
    )
    setDespesasProximosDias(proximosDias)

    // Categorias
    const catMap = {}
    despesasFiltradas.forEach(item => {
      const cat = item.categoria || 'Sem categoria'
      if (!catMap[cat]) catMap[cat] = 0
      catMap[cat] += item.valor
    })
    setDadosCategorias(Object.entries(catMap).map(([nome, valor]) => ({ nome, valor })))

    // Subcategorias
    const subMap = {}
    despesasFiltradas.forEach(item => {
      const sub = item.subcategoria || 'Sem subcategoria'
      if (!subMap[sub]) subMap[sub] = 0
      subMap[sub] += item.valor
    })
    setDadosSubcategorias(Object.entries(subMap).map(([nome, valor]) => ({ nome, valor })))

    // ==========================================
    // INDICADORES AVANÇADOS
    // ==========================================

    // 1. Categoria Mais Cara
    if (dadosCategorias.length > 0) {
      const maisCara = dadosCategorias.reduce((max, cat) => 
        cat.valor > max.valor ? cat : max
      )
      setCategoriaMaisCara(maisCara)
    }

    // 2. Ranking de Categorias (Top 5 por valor de gastos)
    const ranking = [...dadosCategorias]
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
    setRankingCategorias(ranking)

    // 3. Ticket Médio
    const totalDespesasMes = despesasFiltradas.reduce((acc, item) => acc + item.valor, 0)
    const qtdDespesas = despesasFiltradas.length
    setTicketMedio(qtdDespesas > 0 ? totalDespesasMes / qtdDespesas : 0)

    // 4. Previsão de Gastos
    const ultimos3Meses = []
    for (let i = 1; i <= 3; i++) {
      let mes = filtros.mes - i
      let ano = filtros.ano
      if (mes <= 0) {
        mes += 12
        ano -= 1
      }
      const mesStrPrev = String(mes).padStart(2, '0')
      const anoStrPrev = String(ano)
      const gastos = lancamentos
        .filter(item => {
          if (!item.data) return false
          const partes = item.data.split('-')
          return item.tipo === 'despesa' && partes[0] === anoStrPrev && partes[1] === mesStrPrev
        })
        .reduce((acc, item) => acc + item.valor, 0)
      ultimos3Meses.push(gastos)
    }
    const media3Meses = ultimos3Meses.reduce((acc, val) => acc + val, 0) / ultimos3Meses.filter(m => m > 0).length || 0
    setPrevisaoGastos(media3Meses * 1.1)

    // 5. Velocidade de Gastos
    const diasNoMes = new Date(filtros.ano, filtros.mes, 0).getDate()
    const totalGastoMes = despesasFiltradas.reduce((acc, item) => acc + item.valor, 0)
    setVelocidadeGastos(diasNoMes > 0 ? totalGastoMes / diasNoMes : 0)

    // 6. TOP 5 Despesas (MAIORES valores)
    const top5 = despesasFiltradas
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
    setTop5Despesas(top5)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (!carregando) {
      aplicarFiltros()
    }
  }, [lancamentos, filtros, carregando])

  // ==========================================
  // GERAR NOTIFICAÇÕES AUTOMÁTICAS
  // ==========================================
  useEffect(() => {
    const gerarNotificacoes = async () => {
      if (!carregando && lancamentos.length > 0) {
        try {
          await gerarNotificacoesAutomaticas(lancamentos, cartoes, metas, [])
        } catch (error) {
          console.error('Erro ao gerar notificações:', error)
        }
      }
    }
    gerarNotificacoes()
  }, [lancamentos, cartoes, metas, carregando])

  // ==========================================
  // FUNÇÕES DOS FILTROS
  // ==========================================
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  // ==========================================
  // FORMATADORES
  // ==========================================
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

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div style={{ 
      padding: '0 10px',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {/* TÍTULO E FILTROS */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
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
            {carregando ? 'Carregando...' : 
              `${lancamentosFiltrados.length} lançamento(s) · ${contas.length} conta(s) · ${cartoes.length} cartão(ões) · ${metas.length} meta(s)`}
          </p>
        </div>
        
        {/* FILTROS */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>
              Mês
            </label>
            <select
              value={filtros.mes}
              onChange={(e) => handleFiltroChange('mes', parseInt(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px',
                minWidth: '110px'
              }}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m} style={{ backgroundColor: '#1a2b4a' }}>
                  {new Date(2024, m-1).toLocaleString('pt-BR', { month: 'short' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>
              Ano
            </label>
            <select
              value={filtros.ano}
              onChange={(e) => handleFiltroChange('ano', parseInt(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px',
                minWidth: '80px'
              }}
            >
              {[2024, 2025, 2026, 2027, 2028].map(a => (
                <option key={a} value={a} style={{ backgroundColor: '#1a2b4a' }}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>
              Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px',
                minWidth: '100px'
              }}
            >
              <option value="todos" style={{ backgroundColor: '#1a2b4a' }}>Todos</option>
              <option value="receita" style={{ backgroundColor: '#1a2b4a' }}>📈 Receitas</option>
              <option value="despesa" style={{ backgroundColor: '#1a2b4a' }}>📉 Despesas</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==========================================
          RESUMO FINANCEIRO (4 CARDS)
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
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Receitas</p>
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
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Despesas</p>
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
          RANKING DE CATEGORIAS - CORRIGIDO
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
          🏆 Ranking de Categorias
        </h3>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Carregando...</p>
        ) : rankingCategorias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>
              Nenhuma categoria com gastos no período selecionado
            </p>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>
              {lancamentosFiltrados.length === 0 
                ? 'Tente selecionar outro mês ou ano' 
                : 'Suas despesas não estão categorizadas'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rankingCategorias.map((item, index) => {
              const cores = ['#fc8181', '#f6ad55', '#63b3ed', '#b794f4', '#68d391']
              const maxValor = rankingCategorias[0]?.valor || 1
              const percentual = (item.valor / maxValor) * 100
              
              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ 
                    color: 'rgba(255,255,255,0.3)', 
                    fontSize: '13px',
                    fontWeight: '600',
                    minWidth: '24px'
                  }}>
                    {index + 1}º
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ color: '#fff', fontSize: '13px' }}>{item.nome}</span>
                      <span style={{ color: cores[index], fontSize: '13px', fontWeight: '600' }}>
                        {formatarMoeda(item.valor)}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentual}%`,
                        height: '100%',
                        backgroundColor: cores[index],
                        borderRadius: '3px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          TOP 5 DESPESAS - CORRIGIDO (MAIORES VALORES)
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
          🔥 Top 5 Despesas do Período (Maiores Valores)
        </h3>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Carregando...</p>
        ) : top5Despesas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>
              Nenhuma despesa no período selecionado
            </p>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>
              {lancamentosFiltrados.length === 0 
                ? 'Tente selecionar outro mês ou ano' 
                : 'Suas despesas não foram registradas neste período'}
            </p>
          </div>
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
                    {item.categoria || 'Sem categoria'}
                  </span>
                  {item.statusPagamento === 'pago' && (
                    <span style={{
                      backgroundColor: 'rgba(45,138,78,0.2)',
                      color: '#2d8a4e',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      marginLeft: '6px'
                    }}>
                      ✅ Pago
                    </span>
                  )}
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
            <GraficoPizza lancamentos={lancamentosFiltrados} />
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
        ) : lancamentosFiltrados.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Nenhum lançamento para exibir</p>
          </div>
        ) : (
          <GraficoBarras lancamentos={lancamentosFiltrados} />
        )}
      </div>
    </div>
  )
}

export default Dashboard