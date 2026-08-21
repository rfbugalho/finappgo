import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/firebase'

// ============================================
// MENUS PERSONALIZÁVEIS
// ============================================
const MENUS = [
  {
    grupo: "DASHBOARD",
    icone: "📈",
    submenus: [
      { nome: "Visão Geral", rota: "/" }
    ]
  },
  {
    grupo: "FINANCEIRO",
    icone: "💰",
    submenus: [
      { nome: "Lançamentos", rota: "/lancamentos" },
      { nome: "Categorias", rota: "/categorias" },
      { nome: "Contas", rota: "/contas" },
      { nome: "Cartões", rota: "/cartoes" },
      { nome: "Recorrências", rota: "/recorrencias" },
      { nome: "Relatórios", rota: "/relatorios" }
    ]
  },
  {
    grupo: "PATRIMÔNIO",
    icone: "🏠",
    submenus: [
      { nome: "Veículos", rota: "/veiculos" },
      { nome: "Residências", rota: "/residencias" }
    ]
  },
  {
    grupo: "OBJETIVOS",
    icone: "🎯",
    submenus: [
      { nome: "Metas", rota: "/metas" }
    ]
  },
  {
    grupo: "ADMINISTRAÇÃO",
    icone: "⚙️",
    submenus: [
      { nome: "Usuários", rota: "/usuarios" },
      { nome: "Configurações", rota: "/configuracoes" }
    ]
  }
]

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const location = useLocation()
  const navigate = useNavigate()

  // Detectar se é mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    // Configurar estado inicial
    if (window.innerWidth > 768) {
      setSidebarOpen(true)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fechar sidebar ao mudar de página (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const getPageTitle = () => {
    const allSubmenus = MENUS.flatMap(grupo => grupo.submenus)
    const current = allSubmenus.find(sub => sub.rota === location.pathname)
    return current ? current.nome : 'Dashboard'
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: '#0d1b2a',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      overflow: 'hidden'
    }}>
      {/* ==========================================
          OVERLAY (mobile) - Fecha o menu ao clicar fora
          ========================================== */}
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 999,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease'
          }}
        />
      )}

      {/* ==========================================
          SIDEBAR - Menu lateral
          ========================================== */}
      <div style={{
        width: isMobile ? '280px' : (sidebarOpen ? '280px' : '60px'),
        backgroundColor: '#0a1628',
        color: '#fff',
        transition: isMobile ? 'transform 0.3s ease' : 'width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 1000,
        transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        flexShrink: 0,
        boxShadow: isMobile && sidebarOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none'
      }}>
        {/* LOGO */}
        <div style={{
          padding: 'clamp(12px, 2vw, 20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          minHeight: 'clamp(50px, 8vh, 70px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: 'clamp(24px, 4vw, 28px)' }}>💰</span>
            {sidebarOpen && (
              <span style={{ 
                fontSize: 'clamp(18px, 3vw, 20px)', 
                fontWeight: 'bold',
                color: '#ffffff'
              }}>
                FinAppGO
              </span>
            )}
          </div>
          {/* Botão fechar no mobile */}
          {isMobile && sidebarOpen && (
            <button
              onClick={closeSidebar}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* LISTA DE MENUS */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '10px 0'
        }}>
          {MENUS.map((grupo, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {sidebarOpen && (
                <div style={{
                  padding: '8px 20px',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontWeight: '600'
                }}>
                  {grupo.icone} {grupo.grupo}
                </div>
              )}
              {!sidebarOpen && (
                <div style={{
                  padding: '8px 20px',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)',
                  textAlign: 'center'
                }}>
                  {grupo.icone}
                </div>
              )}
              
              {grupo.submenus.map((sub, subIndex) => {
                const isActive = location.pathname === sub.rota
                return (
                  <Link
                    key={subIndex}
                    to={sub.rota}
                    onClick={() => {
                      if (isMobile) closeSidebar()
                    }}
                    style={{
                      display: 'block',
                      padding: sidebarOpen ? '10px 20px' : '10px 12px',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      textDecoration: 'none',
                      fontSize: sidebarOpen ? '14px' : '12px',
                      transition: 'all 0.2s ease',
                      borderLeft: isActive ? '3px solid #3a7abd' : '3px solid transparent',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      margin: '2px 0',
                      borderRadius: isActive ? '0 4px 4px 0' : '0',
                      textAlign: sidebarOpen ? 'left' : 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {sidebarOpen ? sub.nome : sub.nome.charAt(0)}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* BOTÃO RECOLHER/EXPANDIR (apenas desktop) */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '-12px',
              backgroundColor: '#1a2b4a',
              color: '#fff',
              border: '2px solid #0a1628',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              zIndex: 10
            }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        )}
      </div>

      {/* ==========================================
          CONTEÚDO PRINCIPAL
          ========================================== */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0,
        backgroundColor: '#0d1b2a',
        overflow: 'hidden'
      }}>
        {/* HEADER SUPERIOR */}
        <header style={{
          backgroundColor: '#1a2b4a',
          padding: 'clamp(8px, 1.5vw, 15px) clamp(12px, 2vw, 30px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          gap: '10px',
          flexWrap: 'wrap',
          minHeight: 'clamp(50px, 8vh, 70px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Botão Menu Hamburguer (mobile) */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: 'clamp(24px, 4vw, 30px)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Abrir menu"
              >
                ☰
              </button>
            )}
            <h2 style={{ 
              fontSize: 'clamp(14px, 2.5vw, 20px)', 
              color: '#ffffff',
              fontWeight: '500',
              margin: 0
            }}>
              {getPageTitle()}
            </h2>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'clamp(8px, 1.5vw, 20px)',
            flexWrap: 'wrap'
          }}>
            {/* Notificações */}
            <span style={{ 
              fontSize: 'clamp(16px, 2vw, 20px)', 
              cursor: 'pointer',
              position: 'relative'
            }}>
              🔔
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#d94a4a',
                color: '#fff',
                fontSize: 'clamp(8px, 1vw, 10px)',
                borderRadius: '50%',
                padding: '2px 6px',
                fontWeight: 'bold'
              }}>
                3
              </span>
            </span>
            
            {/* Usuário */}
            <span style={{ 
              color: 'rgba(255,255,255,0.8)',
              fontSize: 'clamp(10px, 1.5vw, 14px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: 'clamp(14px, 2vw, 18px)' }}>👤</span>
              <span style={{ 
                display: isMobile ? 'none' : 'inline',
                fontSize: 'clamp(10px, 1.2vw, 14px)'
              }}>
                {isMobile ? '' : 'rafaelbugalho@finappgo.com.br'}
              </span>
            </span>
            
            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: isMobile ? '6px 12px' : 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: isMobile ? '11px' : 'clamp(11px, 1.5vw, 13px)',
                fontWeight: '500',
                transition: 'background-color 0.2s, border-color 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'
                e.target.style.borderColor = 'rgba(255,255,255,0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.12)'
                e.target.style.borderColor = 'rgba(255,255,255,0.15)'
              }}
            >
              {isMobile ? '🚪' : 'Sair'}
            </button>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <main style={{
          flex: 1,
          padding: isMobile ? 'clamp(8px, 2vw, 15px)' : 'clamp(15px, 3vw, 30px)',
          overflowY: 'auto',
          backgroundColor: '#0d1b2a'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout