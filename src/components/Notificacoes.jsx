import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  buscarNotificacoes, 
  marcarComoLido, 
  marcarTodasComoLidas,
  excluirNotificacao,
  excluirNotificacoesLidas
} from '../firebase/notificacoesService'

function Notificacoes({ onClose }) {
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  const carregarNotificacoes = async () => {
    setCarregando(true)
    const dados = await buscarNotificacoes()
    setNotificacoes(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarNotificacoes()
  }, [])

  const handleMarcarComoLido = async (id) => {
    await marcarComoLido(id)
    await carregarNotificacoes()
  }

  const handleMarcarTodasComoLidas = async () => {
    await marcarTodasComoLidas()
    await carregarNotificacoes()
  }

  const handleExcluirNotificacao = async (id) => {
    await excluirNotificacao(id)
    await carregarNotificacoes()
  }

  const handleExcluirLidas = async () => {
    await excluirNotificacoesLidas()
    await carregarNotificacoes()
  }

  const handleClickNotificacao = (notificacao) => {
    if (notificacao.link) {
      navigate(notificacao.link)
    }
    if (!notificacao.lido) {
      handleMarcarComoLido(notificacao.id)
    }
    if (onClose) onClose()
  }

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lido).length

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 10px)',
      right: '-20px',
      backgroundColor: '#1a2b4a',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      width: '400px',
      maxWidth: '90vw',
      maxHeight: '500px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* HEADER */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0d1b2a'
      }}>
        <div>
          <span style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>
            🔔 Notificações
          </span>
          {notificacoesNaoLidas > 0 && (
            <span style={{
              marginLeft: '8px',
              backgroundColor: '#d94a4a',
              color: '#fff',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {notificacoesNaoLidas}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {notificacoesNaoLidas > 0 && (
            <button
              onClick={handleMarcarTodasComoLidas}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Marcar todas lidas
            </button>
          )}
          <button
            onClick={handleExcluirLidas}
            style={{
              backgroundColor: 'rgba(217,74,74,0.2)',
              color: '#d94a4a',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Limpar lidas
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0'
      }}>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
            Carregando...
          </p>
        ) : notificacoes.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>
            Nenhuma notificação
          </p>
        ) : (
          notificacoes.map(notificacao => (
            <div
              key={notificacao.id}
              onClick={() => handleClickNotificacao(notificacao)}
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                backgroundColor: notificacao.lido ? 'transparent' : 'rgba(58,122,189,0.05)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                borderLeft: `4px solid ${notificacao.cor || '#3a7abd'}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
              onMouseLeave={(e) => {
                if (!notificacao.lido) {
                  e.currentTarget.style.backgroundColor = 'rgba(58,122,189,0.05)'
                } else {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    color: '#fff', 
                    fontSize: '14px', 
                    fontWeight: notificacao.lido ? '400' : '600',
                    margin: '0 0 4px 0'
                  }}>
                    {notificacao.icone} {notificacao.titulo}
                  </p>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '13px',
                    margin: '0'
                  }}>
                    {notificacao.mensagem}
                  </p>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.2)', 
                    fontSize: '11px',
                    margin: '4px 0 0 0'
                  }}>
                    {new Date(notificacao.criadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {!notificacao.lido && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarcarComoLido(notificacao.id); }}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.4)',
                        border: 'none',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      ✔️
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExcluirNotificacao(notificacao.id); }}
                    style={{
                      backgroundColor: 'rgba(217,74,74,0.2)',
                      color: '#d94a4a',
                      border: 'none',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Notificacoes