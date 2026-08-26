import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ConfigProvider } from './contexts/ConfigContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Categorias from './pages/Categorias'
import Contas from './pages/Contas'
import Cartoes from './pages/Cartoes'
import Metas from './pages/Metas'
import Veiculos from './pages/Veiculos'
import Residencias from './pages/Residencias'
import Recorrencias from './pages/Recorrencias'
import Relatorios from './pages/Relatorios'
import Usuarios from './pages/Usuarios'
import Configuracoes from './pages/Configuracoes'
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
      
      <Route path="/recorrencias" element={
  <PrivateRoute>
    <Layout>
      <Recorrencias />
    </Layout>
  </PrivateRoute>
} />
      
      <Route path="/relatorios" element={
        <PrivateRoute>
          <Layout>
            <Relatorios />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* PATRIMÔNIO */}
      <Route path="/veiculos" element={
        <PrivateRoute>
          <Layout>
            <Veiculos />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/residencias" element={
        <PrivateRoute>
          <Layout>
            <Residencias />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* OBJETIVOS */}
      <Route path="/metas" element={
        <PrivateRoute>
          <Layout>
            <Metas />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* ADMINISTRAÇÃO */}
      <Route path="/usuarios" element={
        <PrivateRoute>
          <Layout>
            <Usuarios />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/configuracoes" element={
        <PrivateRoute>
          <Layout>
            <Configuracoes />
          </Layout>
        </PrivateRoute>
      } />
      
      {/* INVESTIMENTOS (placeholder) */}
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
        <ConfigProvider>
          <AppRoutes />
        </ConfigProvider>
      </AuthProvider>
    </Router>
  )
}

export default App