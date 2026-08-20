import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Categorias from './pages/Categorias'
import Contas from './pages/Contas'
import Cartoes from './pages/Cartoes'
import Login from './pages/Login'

// ==========================================
// COMPONENTE PARA PROTEGER ROTAS
// ==========================================
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{ 
        color: '#fff', 
        padding: '50px', 
        textAlign: 'center',
        backgroundColor: '#0d1b2a',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px'
      }}>
        Carregando...
      </div>
    )
  }
  
  return user ? children : <Navigate to="/login" />
}

// ==========================================
// ROTAS DO SISTEMA
// ==========================================
function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        color: '#fff', 
        padding: '50px', 
        textAlign: 'center',
        backgroundColor: '#0d1b2a',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px'
      }}>
        Carregando...
      </div>
    )
  }

  return (
    <Routes>
      {/* ROTA DE LOGIN (SEM LAYOUT) */}
      <Route path="/login" element={<Login />} />
      
      {/* ==========================================
          ROTAS PROTEGIDAS (COM LAYOUT)
          ========================================== */}
      
      {/* DASHBOARD */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* FINANCEIRO */}
      <Route path="/lancamentos" element={
        <PrivateRoute>
          <Layout>
            <Lancamentos />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/categorias" element={
        <PrivateRoute>
          <Layout>
            <Categorias />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/metas" element={
  <PrivateRoute>
    <Layout>
      <Metas />
    </Layout>
  </PrivateRoute>
} />
      
      <Route path="/contas" element={
        <PrivateRoute>
          <Layout>
            <Contas />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/cartoes" element={
        <PrivateRoute>
          <Layout>
            <Cartoes />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/relatorios" element={
        <PrivateRoute>
          <Layout>
            <div>
              <h2 style={{ fontSize: '24px', color: '#ffffff' }}>📊 Relatórios</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Visualize relatórios detalhados</p>
            </div>
          </Layout>
        </PrivateRoute>
      } />
      
      {/* INVESTIMENTOS */}
      <Route path="/carteira" element={
        <PrivateRoute>
          <Layout>
            <div>
              <h2 style={{ fontSize: '24px', color: '#ffffff' }}>📊 Carteira</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Acompanhe seus investimentos</p>
            </div>
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/rendimentos" element={
        <PrivateRoute>
          <Layout>
            <div>
              <h2 style={{ fontSize: '24px', color: '#ffffff' }}>📈 Rendimentos</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Visualize seus rendimentos</p>
            </div>
          </Layout>
        </PrivateRoute>
      } />
      
      {/* ADMINISTRAÇÃO */}
      <Route path="/usuarios" element={
        <PrivateRoute>
          <Layout>
            <div>
              <h2 style={{ fontSize: '24px', color: '#ffffff' }}>👥 Usuários</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Gerencie os usuários do sistema</p>
            </div>
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/configuracoes" element={
        <PrivateRoute>
          <Layout>
            <div>
              <h2 style={{ fontSize: '24px', color: '#ffffff' }}>⚙️ Configurações</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Configure o sistema</p>
            </div>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}

// ==========================================
// APP PRINCIPAL
// ==========================================
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App