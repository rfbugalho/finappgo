import React, { useState } from 'react'
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
    grupo: "INVESTIMENTOS",
    icone: "📊",
    submenus: [
      { nome: "Carteira", rota: "/carteira" },
      { nome: "Rendimentos", rota: "/rendimentos" }
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  // ==========================================
  // FUNÇÃO PARA ENCONTRAR O TÍTULO DA PÁGINA
  // ==========================================
  const getPageTitle = () => {
    const allSubmenus = MENUS.flatMap(grupo => grupo.submenus)
    const current = allSubmenus.find(sub => sub.rota === location.pathname)
    return current ? current.nome : 'Dashboard'
  }

  // ==========================================
  // FUNÇÃO PARA SAIR (LOGOUT)
  // ==========================================
  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: '#0d1b2a',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* ==========================================
          SIDEBAR - AZUL ESCURO
          ========================================== */}
      <div style={{
        width: sidebarOpen ? '280px' : '60px',
        backgroundColor: '#0a1628',
        color: '#fff',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0
      }}>
        {/* LOGO */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: '70px'
        }}>
          <span style={{ fontSize: '28px' }}>💰</span>
          {sidebarOpen && (
            <span style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              color: '#ffffff'
            }}>
              FinAppGO
            </span>
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
              {/* Título do grupo */}
              <div style={{
                padding: '10px 20px',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}>
                {sidebarOpen ? `${grupo.icone} ${grupo.grupo}` : grupo.icone}
              </div>
              
              {/* Submenus */}
              {grupo.submenus.map((sub, subIndex) => {
                const isActive = location.pathname === sub.rota
                return (
                  <Link
                    key={subIndex}
                    to={sub.rota}
                    style={{
                      display: 'block',
                      padding: '10px 20px',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      textDecoration: 'none',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      borderLeft: isActive ? '3px solid #3a7abd' : '3px solid transparent',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      margin: '2px 0',
                      borderRadius: isActive ? '0 4px 4px 0' : '0'
                    }}
                  >
                    {sidebarOpen ? sub.nome : sub.nome.charAt(0)}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* BOTÃO PARA RECOLHER/EXPANDIR SIDEBAR */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
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
      </div>

      {/* ==========================================
          CONTEÚDO PRINCIPAL
          ========================================== */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0,
        backgroundColor: '#0d1b2a'
      }}>
        {/* HEADER SUPERIOR */}
        <header style={{
          backgroundColor: '#1a2b4a',
          padding: 'clamp(10px, 2vw, 15px) clamp(15px, 3vw, 30px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h2 style={{ 
              fontSize: 'clamp(16px, 2.5vw, 20px)', 
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
            gap: 'clamp(10px, 2vw, 20px)',
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
              fontSize: 'clamp(11px, 1.5vw, 14px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>👤</span>
              <span style={{ display: 'inline', '@media (min-width: 768px)': { display: 'inline' } }}>
                rafaelbugalho@finappgo.com.br
              </span>
            </span>
            
            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 'clamp(11px, 1.5vw, 13px)',
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
              Sair
            </button>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <main style={{
          flex: 1,
          padding: 'clamp(10px, 3vw, 30px)',
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