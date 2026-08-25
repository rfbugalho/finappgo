import React, { useState, useEffect } from 'react'
import { buscarLancamentos } from '../firebase/lancamentosService'
import { buscarCategorias } from '../firebase/categoriasService'
import { exportarCSV, exportarExcel, exportarResumo } from '../services/exportService'

function Relatorios() {
  const [lancamentos, setLancamentos] = useState([])
  const [lancamentosFiltrados, setLancamentosFiltrados] = useState([])
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [exportando, setExportando] = useState(false)

  // ==========================================
  // FILTROS
  // ==========================================
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    tipo: 'todos',
    categoria: ''
  })

  // ==========================================
  // TOTAIS
  // ==========================================
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [saldo, setSaldo] = useState(0)

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarDados = async () => {
    setCarregando(true)
    const dados = await buscarLancamentos()
    setLancamentos(dados)
    
    const categoriasDados = await buscarCategorias()
    setCategorias(categoriasDados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // ==========================================
  // APLICAR FILTROS
  // ==========================================
  useEffect(() => {
    if (carregando) return

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

    if (filtros.categoria) {
      dados = dados.filter(item => item.categoria === filtros.categoria)
    }

    setLancamentosFiltrados(dados)

    const receitas = dados
      .filter(item => item.tipo === 'receita')
      .reduce((acc, item) => acc + item.valor, 0)
    
    const despesas = dados
      .filter(item => item.tipo === 'despesa')
      .reduce((acc, item) => acc + item.valor, 0)
    
    setTotalReceitas(receitas)
    setTotalDespesas(despesas)
    setSaldo(receitas - despesas)
  }, [lancamentos, filtros, carregando])

  // ==========================================
  // FUNÇÕES DE EXPORTAÇÃO
  // ==========================================
  const handleExportCSV = () => {
    if (lancamentosFiltrados.length === 0) {
      alert('Não há lançamentos para exportar no período selecionado.')
      return
    }
    setExportando(true)
    try {
      const nomeArquivo = `relatorio_${filtros.ano}_${String(filtros.mes).padStart(2, '0')}`
      exportarCSV(lancamentosFiltrados, totalReceitas, totalDespesas, saldo, nomeArquivo)
    } catch (error) {
      alert('Erro ao exportar CSV.')
      console.error(error)
    }
    setExportando(false)
  }

  const handleExportExcel = () => {
    if (lancamentosFiltrados.length === 0) {
      alert('Não há lançamentos para exportar no período selecionado.')
      return
    }
    setExportando(true)
    try {
      const nomeArquivo = `relatorio_${filtros.ano}_${String(filtros.mes).padStart(2, '0')}`
      exportarExcel(lancamentosFiltrados, totalReceitas, totalDespesas, saldo, nomeArquivo)
    } catch (error) {
      alert('Erro ao exportar Excel.')
      console.error(error)
    }
    setExportando(false)
  }

  const handleExportResumo = () => {
    if (lancamentos.length === 0) {
      alert('Não há lançamentos para exportar.')
      return
    }
    setExportando(true)
    try {
      const nomeArquivo = `resumo_completo_${filtros.ano}_${String(filtros.mes).padStart(2, '0')}`
      exportarResumo(lancamentos, totalReceitas, totalDespesas, saldo, nomeArquivo)
    } catch (error) {
      alert('Erro ao exportar resumo.')
      console.error(error)
    }
    setExportando(false)
  }

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

  return (
    <div>
      {/* CABEÇALHO */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '4px' }}>
          📊 Relatórios
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          Exporte seus dados para CSV ou Excel
        </p>
      </div>

      {/* FILTROS */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              📅 Mês
            </label>
            <select
              value={filtros.mes}
              onChange={(e) => setFiltros({ ...filtros, mes: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m} style={{ backgroundColor: '#1a2b4a' }}>
                  {new Date(2024, m-1).toLocaleString('pt-BR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              📅 Ano
            </label>
            <select
              value={filtros.ano}
              onChange={(e) => setFiltros({ ...filtros, ano: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              {[2024, 2025, 2026, 2027].map(a => (
                <option key={a} value={a} style={{ backgroundColor: '#1a2b4a' }}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              📊 Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="todos" style={{ backgroundColor: '#1a2b4a' }}>Todos</option>
              <option value="receita" style={{ backgroundColor: '#1a2b4a' }}>📈 Receitas</option>
              <option value="despesa" style={{ backgroundColor: '#1a2b4a' }}>📉 Despesas</option>
            </select>
          </div>

          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              🏷️ Categoria
            </label>
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="" style={{ backgroundColor: '#1a2b4a' }}>Todas</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.nome} style={{ backgroundColor: '#1a2b4a' }}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* RESUMO DO PERÍODO */}
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
          <p style={{ color: '#2d8a4e', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            {formatarMoeda(totalReceitas)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(217,74,74,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(217,74,74,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Despesas</p>
          <p style={{ color: '#d94a4a', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            {formatarMoeda(totalDespesas)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(58,122,189,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(58,122,189,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Saldo</p>
          <p style={{ color: saldo >= 0 ? '#2d8a4e' : '#d94a4a', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            {formatarMoeda(saldo)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(159,122,234,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(159,122,234,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Lançamentos</p>
          <p style={{ color: '#9f7aea', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            {lancamentosFiltrados.length}
          </p>
        </div>
      </div>

      {/* BOTÕES DE EXPORTAÇÃO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <button
          onClick={handleExportCSV}
          disabled={exportando || lancamentosFiltrados.length === 0}
          style={{
            padding: '14px',
            backgroundColor: '#3a7abd',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: exportando || lancamentosFiltrados.length === 0 ? 'not-allowed' : 'pointer',
            opacity: exportando || lancamentosFiltrados.length === 0 ? 0.5 : 1,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!exportando && lancamentosFiltrados.length > 0) {
              e.target.style.backgroundColor = '#2a5a8a'
            }
          }}
          onMouseLeave={(e) => {
            if (!exportando && lancamentosFiltrados.length > 0) {
              e.target.style.backgroundColor = '#3a7abd'
            }
          }}
        >
          📄 Exportar CSV
        </button>

        <button
          onClick={handleExportExcel}
          disabled={exportando || lancamentosFiltrados.length === 0}
          style={{
            padding: '14px',
            backgroundColor: '#2d8a4e',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: exportando || lancamentosFiltrados.length === 0 ? 'not-allowed' : 'pointer',
            opacity: exportando || lancamentosFiltrados.length === 0 ? 0.5 : 1,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!exportando && lancamentosFiltrados.length > 0) {
              e.target.style.backgroundColor = '#1a6a3a'
            }
          }}
          onMouseLeave={(e) => {
            if (!exportando && lancamentosFiltrados.length > 0) {
              e.target.style.backgroundColor = '#2d8a4e'
            }
          }}
        >
          📊 Exportar Excel
        </button>

        <button
          onClick={handleExportResumo}
          disabled={exportando || lancamentos.length === 0}
          style={{
            padding: '14px',
            backgroundColor: '#9f7aea',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: exportando || lancamentos.length === 0 ? 'not-allowed' : 'pointer',
            opacity: exportando || lancamentos.length === 0 ? 0.5 : 1,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!exportando && lancamentos.length > 0) {
              e.target.style.backgroundColor = '#7a5ac8'
            }
          }}
          onMouseLeave={(e) => {
            if (!exportando && lancamentos.length > 0) {
              e.target.style.backgroundColor = '#9f7aea'
            }
          }}
        >
          📋 Exportar Resumo
        </button>
      </div>

      {/* INFO */}
      {lancamentosFiltrados.length === 0 && !carregando && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '14px'
        }}>
          Nenhum lançamento encontrado no período selecionado
        </div>
      )}

      {/* CARREGANDO */}
      {carregando && (
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '14px'
        }}>
          Carregando dados...
        </div>
      )}
    </div>
  )
}

export default Relatorios