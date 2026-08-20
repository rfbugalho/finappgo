import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Categorias from './pages/Categorias'
import Login from './pages/Login'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div style={{ color: '#fff', padding: '50px', textAlign: 'center' }}>Carregando...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ color: '#fff', padding: '50px', textAlign: 'center' }}>Carregando...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </PrivateRoute>
      } />
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
    </Routes>
  )
}

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