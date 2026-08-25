import React from 'react'

function Usuarios() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', color: '#ffffff' }}>
        👥 Usuários
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>
        Teste - Tela de Usuários funcionando!
      </p>
      <button
        onClick={() => alert('Botão funcionando!')}
        style={{
          backgroundColor: '#2d8a4e',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '20px'
        }}
      >
        ➕ Testar Botão
      </button>
    </div>
  )
}

export default Usuarios