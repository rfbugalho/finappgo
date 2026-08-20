import React from 'react'

function Header() {
  return (
    <header style={{
      backgroundColor: '#2d3748',
      color: '#fff',
      padding: '15px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '24px' }}>💰</span>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>FinAppGO</h1>
      </div>
      <nav style={{ display: 'flex', gap: '20px' }}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</a>
        <a href="/lancamentos" style={{ color: '#fff', textDecoration: 'none' }}>Lançamentos</a>
        <a href="/login" style={{ color: '#fff', textDecoration: 'none' }}>Sair</a>
      </nav>
    </header>
  )
}

export default Header