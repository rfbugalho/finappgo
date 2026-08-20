import React from 'react'

function TabelaLancamentos({ lancamentos }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Data</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Descrição</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Categoria</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {lancamentos.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: '12px' }}>{item.data}</td>
              <td style={{ padding: '12px' }}>{item.descricao}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  backgroundColor: item.tipo === 'receita' ? '#bee3f8' : '#fed7d7',
                  color: item.tipo === 'receita' ? '#2b6cb0' : '#9b2c2c',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px'
                }}>
                  {item.categoria}
                </span>
              </td>
              <td style={{
                padding: '12px',
                textAlign: 'right',
                fontWeight: '600',
                color: item.tipo === 'receita' ? '#48bb78' : '#fc8181'
              }}>
                {item.tipo === 'receita' ? '+' : '-'} R$ {item.valor.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TabelaLancamentos