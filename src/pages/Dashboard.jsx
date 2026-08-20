import React, { useState, useEffect } from 'react'
import Card from '../components/Card'
import GraficoBarras from '../components/GraficoBarras'
import GraficoPizza from '../components/GraficoPizza'
import { buscarLancamentos } from '../firebase/lancamentosService'

function Dashboard() {
  const [lancamentos, setLancamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [saldo, setSaldo] = useState(0)
  const [economiaPercentual, setEconomiaPercentual] = useState(0)

  // Carregar lançamentos do Firebase
  const carregarDados = async () => {
    setCarregando(true)
    const dados = await buscarLancamentos()
    setLancamentos(dados)
    
    // Calcular totais
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
    setCarregando(false)
  }

  // Carregar ao abrir a página
  useEffect(() => {
    carregarDados()
  }, [])

  // Dados para os cards (exemplo)
  const metasCumpridas = 12
  const totalMetas = 15
  const apontamentos = 3

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
          Visão Geral
        </h2>
        <p style={{ 
          color: 'rgba(255,255,255,0.5)', 
          fontSize: '14px'
        }}>
          Ano: 2026 · {carregando ? 'Carregando...' : `${lancamentos.length} lançamento(s) disponível(is)`}
        </p>
      </div>

      {/* CARDS - Dados Reais */}
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
          titulo="METAS CUMPRIDAS" 
          valor={`${metasCumpridas}/${totalMetas}`}
          subtitulo="vs. período ant."
          cor="#1a5a8a"
          icone="🎯"
        />
        <Card 
          titulo="DESCONTO APLICADO" 
          valor="R$ 0,00"
          subtitulo="vs. ant."
          cor="#e07c2c"
          icone="💰"
        />
        <Card 
          titulo="APONTAMENTOS" 
          valor={apontamentos}
          subtitulo="Flags ativos no sistema"
          cor="#d94a4a"
          icone="🚩"
        />
      </div>

      {/* GRÁFICOS - Dados Reais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          height: '300px'
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Evolução dos Scores
          </h3>
          {carregando ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'rgba(255,255,255,0.3)'
            }}>
              <p>Carregando gráfico...</p>
            </div>
          ) : (
            <GraficoBarras lancamentos={lancamentos} />
          )}
        </div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          height: '300px'
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Gastos por Categoria
          </h3>
          {carregando ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'rgba(255,255,255,0.3)'
            }}>
              <p>Carregando gráfico...</p>
            </div>
          ) : (
            <GraficoPizza lancamentos={lancamentos} />
          )}
        </div>
      </div>

      {/* RESUMO FINANCEIRO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Resumo Financeiro
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '15px'
          }}>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Total Receitas</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d8a4e' }}>
                {carregando ? '...' : `R$ ${totalReceitas.toFixed(2)}`}
              </p>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Total Despesas</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#d94a4a' }}>
                {carregando ? '...' : `R$ ${totalDespesas.toFixed(2)}`}
              </p>
            </div>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Saldo</p>
              <p style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: saldo >= 0 ? '#2d8a4e' : '#d94a4a'
              }}>
                {carregando ? '...' : `R$ ${saldo.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h3 style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Últimos Lançamentos
          </h3>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Carregando...</p>
          ) : lancamentos.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Nenhum lançamento</p>
          ) : (
            <div>
              {lancamentos.slice(0, 5).map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#ffffff' }}>{item.descricao}</span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'rgba(255,255,255,0.3)',
                      marginLeft: '10px'
                    }}>
                      {item.categoria}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '600',
                    color: item.tipo === 'receita' ? '#2d8a4e' : '#d94a4a'
                  }}>
                    {item.tipo === 'receita' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard