import React from 'react'

function Card({ titulo, valor, subtitulo, cor, icone }) {
  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.05)',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div style={{
        height: '4px',
        backgroundColor: cor || '#4299e1',
        marginBottom: '12px',
        borderRadius: '2px'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ 
            fontSize: '11px', 
            color: 'rgba(255,255,255,0.4)', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            fontWeight: '600',
            margin: 0
          }}>
            {titulo}
          </p>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#ffffff', 
            margin: '8px 0 4px 0'
          }}>
            {valor}
          </p>
          {subtitulo && (
            <p style={{ 
              fontSize: '11px', 
              color: 'rgba(255,255,255,0.3)',
              margin: 0
            }}>
              {subtitulo}
            </p>
          )}
        </div>
        {icone && (
          <span style={{ 
            fontSize: '28px',
            opacity: 0.3
          }}>
            {icone}
          </span>
        )}
      </div>
    </div>
  )
}

export default Card