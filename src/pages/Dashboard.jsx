import React, { useState, useEffect } from 'react'
import Card from '../components/Card'
import GraficoBarras from '../components/GraficoBarras'
import GraficoPizza from '../components/GraficoPizza'
import { buscarLancamentos } from '../firebase/lancamentosService'
import { buscarContas } from '../firebase/contasService'

function Dashboard() {
  const [lancamentos, setLancamentos] = useState([])
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [saldo, setSaldo] = useState(0)
  const [economiaPercentual, setEconomiaPercentual] = useState(0)

  // ==========================================
  // DADOS DE DESPESAS PENDENTES
  // ==========================================
  const [despesasVencidas, setDespesasVencidas] = useState([])
  const [despesasHoje, setDespesasHoje] = useState([])
  const [despesasProximosDias, setDespesasProximosDias] = useState([])
  const [valorTotalVencido, setValorTotalVencido] = useState(0)
  const [valorTotalHoje, setValorTotalHoje] = useState(0)

  // ==========================================
  // DADOS PARA GRÁFICOS
  // ==========================================
  const [dadosCategorias, setDadosCategorias] = useState([])
  const [dadosSubcategorias, setDadosSubcategorias] = useState([])

  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)
  const amanhaStr = amanha.toISOString().split('T')[0]
  const proximos7Dias = new Date(hoje)
  proximos7Dias.setDate(proximos7Dias.getDate() + 7)
  const proximos7DiasStr = proximos7Dias.toISOString().split('T')[0]

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarDados = async () => {
    setCarregando(true)
    
    // Buscar lançamentos e contas
    const dadosLancamentos = await buscarLancamentos()
    const dadosContas = await buscarContas()
    
    setLancamentos(dadosLancamentos)
    setContas(dadosContas)
    
    // Calcular totais
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

    // ==========================================
    // PROCESSAR DESPESAS PENDENTES
    // ==========================================
    const despesas = dadosLancamentos.filter(item => item.tipo === 'despesa')
    
    // Despesas vencidas (data < hoje)
    const vencidas = despesas.filter(item => item.data < hojeStr)
    setDespesasVencidas(vencidas)
    setValorTotalVencido(vencidas.reduce((acc, item) => acc + item.valor, 0))
    
    // Despesas de hoje
    const hojeDespesas = despesas.filter(item => item.data === hojeStr)
    setDespesasHoje(hojeDespesas)
    setValorTotalHoje(hojeDespesas.reduce((acc, item) => acc + item.valor, 0))
    
    // Despesas dos próximos 7 dias (excluindo hoje)
    const proximosDias = despesas.filter(item => 
      item.data > hojeStr && item.data <= proximos7DiasStr
    )
    setDespesasProximosDias(proximosDias)

    // ==========================================
    // PROCESSAR DADOS PARA GRÁFICOS
    // ==========================================
    // Agrupar despesas por categoria
    const catMap = {}
    despesas.forEach(item => {
      const cat = item.categoria || 'Sem categoria'
      if (!catMap[cat]) catMap[cat] = 0
      catMap[cat] += item.valor
    })
    setDadosCategorias(Object.entries(catMap).map(([nome, valor]) => ({ nome, valor })))

    // Agrupar despesas por subcategoria
    const subMap = {}
    despesas.forEach(item => {
      const sub = item.subcategoria || 'Sem subcategoria'
      if (!subMap[sub]) subMap[sub] = 0
      subMap[sub] += item.valor
    })
    setDadosSubcategorias(Object.entries(subMap).map(([nome, valor]) => ({ nome, valor })))

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

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div>
      {/* TÍTULO */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          color: '#ffffff',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          📊 Visão Geral
        </h2>
        <p style={{ 
          color: 'rgba(255,255,255,0.5)', 
          fontSize: '14px'
        }}>
          {carregando ? 'Carregando...' : `${lancamentos.length} lançamento(s) · ${contas.length} conta(s) ativa(s)`}
        </p>
      </div>

      {/* CARDS SUPERIORES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '30px'
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
          SEÇÃO: CONTAS E SALDOS
          ========================================== */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          fontSize: '14px', 
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '600',
          marginBottom: '15px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          💰 Contas e Saldos
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
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
                  backgroundColor: conta.cor || '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  {conta.logo || '🏦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    color: '#fff', 
                    fontSize: '13px', 
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
                    fontSize: '14px',
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
          SEÇÃO: DESPESAS PENDENTES
          ========================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Vencidas */}
        <div style={{
          backgroundColor: 'rgba(217,74,74,0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(217,74,74,0.2)'
        }}>
          <h4 style={{ color: '#d94a4a', fontSize: '13px', margin: '0 0 8px 0' }}>
            🔴 Vencidas
          </h4>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Carregando...</p>
          ) : despesasVencidas.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              Nenhuma despesa vencida ✅
            </p>
          ) : (
            <div>
              <p style={{ color: '#d94a4a', fontSize: '18px', fontWeight: '700', margin: '0' }}>
                {formatarMoeda(valorTotalVencido)}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0 0' }}>
                {despesasVencidas.length} despesa(s) vencida(s)
              </p>
            </div>
          )}
        </div>

        {/* Hoje */}
        <div style={{
          backgroundColor: 'rgba(237,137,54,0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(237,137,54,0.2)'
        }}>
          <h4 style={{ color: '#ed8936', fontSize: '13px', margin: '0 0 8px 0' }}>
            🟡 Vencem Hoje
          </h4>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Carregando...</p>
          ) : despesasHoje.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              Nenhuma despesa hoje ✅
            </p>
          ) : (
            <div>
              <p style={{ color: '#ed8936', fontSize: '18px', fontWeight: '700', margin: '0' }}>
                {formatarMoeda(valorTotalHoje)}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0 0' }}>
                {despesasHoje.length} despesa(s) para hoje
              </p>
            </div>
          )}
        </div>

        {/* Próximos Dias */}
        <div style={{
          backgroundColor: 'rgba(58,122,189,0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(58,122,189,0.2)'
        }}>
          <h4 style={{ color: '#3a7abd', fontSize: '13px', margin: '0 0 8px 0' }}>
            🔵 Próximos 7 Dias
          </h4>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Carregando...</p>
          ) : despesasProximosDias.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
              Nenhuma despesa nos próximos dias ✅
            </p>
          ) : (
            <div>
              <p style={{ color: '#3a7abd', fontSize: '18px', fontWeight: '700', margin: '0' }}>
                {formatarMoeda(despesasProximosDias.reduce((acc, item) => acc + item.valor, 0))}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0 0' }}>
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
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Gráfico de Categorias */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          height: '280px'
        }}>
          <h3 style={{ 
            fontSize: '13px', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📊 Gastos por Categoria
          </h3>
          {carregando ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
            </div>
          ) : dadosCategorias.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                Nenhum dado de categoria disponível
              </p>
            </div>
          ) : (
            <GraficoPizza lancamentos={lancamentos} />
          )}
        </div>

        {/* Gráfico de Subcategorias */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          height: '280px'
        }}>
          <h3 style={{ 
            fontSize: '13px', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📊 Gastos por Subcategoria
          </h3>
          {carregando ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
            </div>
          ) : dadosSubcategorias.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                Nenhum dado de subcategoria disponível
              </p>
            </div>
          ) : (
            <GraficoPizzaSubcategorias dados={dadosSubcategorias} />
          )}
        </div>
      </div>

      {/* Gráfico de Evolução */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        height: '280px',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          fontSize: '13px', 
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '600',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          📈 Evolução dos Scores (Receitas x Despesas)
        </h3>
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
          </div>
        ) : lancamentos.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
              Nenhum lançamento para exibir
            </p>
          </div>
        ) : (
          <GraficoBarras lancamentos={lancamentos} />
        )}
      </div>

      {/* RESUMO FINANCEIRO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(45,138,78,0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(45,138,78,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Total Receitas</p>
          <p style={{ color: '#2d8a4e', fontSize: '20px', fontWeight: '700', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(totalReceitas)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(217,74,74,0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(217,74,74,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Total Despesas</p>
          <p style={{ color: '#d94a4a', fontSize: '20px', fontWeight: '700', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(totalDespesas)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(58,122,189,0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(58,122,189,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Saldo</p>
          <p style={{ color: saldo >= 0 ? '#2d8a4e' : '#d94a4a', fontSize: '20px', fontWeight: '700', margin: 0 }}>
            {carregando ? '...' : formatarMoeda(saldo)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(159,122,234,0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid rgba(159,122,234,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Economia</p>
          <p style={{ color: '#9f7aea', fontSize: '20px', fontWeight: '700', margin: 0 }}>
            {carregando ? '...' : `${economiaPercentual.toFixed(1)}%`}
          </p>
        </div>
      </div>
    </div>
  )
}

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

  const { Pie } = require('react-chartjs-2')
  return <Pie data={data} options={options} />
}

export default Dashboard