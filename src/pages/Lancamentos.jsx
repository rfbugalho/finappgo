import React, { useState, useEffect } from 'react'
import { 
  buscarLancamentos, 
  adicionarLancamento, 
  atualizarLancamento, 
  excluirLancamento 
} from '../firebase/lancamentosService'

function Lancamentos() {
  const [lancamentos, setLancamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEdicao, setModalEdicao] = useState(false)
  
  const [formData, setFormData] = useState({
    id: null,
    data: '',
    descricao: '',
    categoria: '',
    tipo: 'despesa',
    valor: ''
  })

  const categorias = ['Renda', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Serviços', 'Outros']

  // Carregar lançamentos do Firebase
  const carregarLancamentos = async () => {
    setCarregando(true)
    const dados = await buscarLancamentos()
    setLancamentos(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarLancamentos()
  }, [])

  const abrirModalNovo = () => {
    setFormData({
      id: null,
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      categoria: '',
      tipo: 'despesa',
      valor: ''
    })
    setModalEdicao(false)
    setModalAberto(true)
  }

  const abrirModalEditar = (lancamento) => {
    setFormData({
      id: lancamento.id,
      data: lancamento.data,
      descricao: lancamento.descricao,
      categoria: lancamento.categoria,
      tipo: lancamento.tipo,
      valor: lancamento.valor
    })
    setModalEdicao(true)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setFormData({
      id: null,
      data: '',
      descricao: '',
      categoria: '',
      tipo: 'despesa',
      valor: ''
    })
  }

  const salvarLancamento = async (e) => {
    e.preventDefault()
    
    const valorNumero = parseFloat(formData.valor)
    if (isNaN(valorNumero) || valorNumero <= 0) {
      alert('Por favor, insira um valor válido maior que zero.')
      return
    }

    const dadosParaSalvar = {
      data: formData.data,
      descricao: formData.descricao,
      categoria: formData.categoria,
      tipo: formData.tipo,
      valor: valorNumero
    }

    try {
      if (modalEdicao) {
        await atualizarLancamento(formData.id, dadosParaSalvar)
      } else {
        await adicionarLancamento(dadosParaSalvar)
      }
      
      await carregarLancamentos()
      fecharModal()
    } catch (error) {
      alert('Erro ao salvar lançamento. Tente novamente.')
      console.error(error)
    }
  }

  const handleExcluir = async (id, descricao) => {
    if (window.confirm(`Tem certeza que deseja excluir "${descricao}"?`)) {
      try {
        await excluirLancamento(id)
        await carregarLancamentos()
      } catch (error) {
        alert('Erro ao excluir lançamento. Tente novamente.')
        console.error(error)
      }
    }
  }

  const formatarValor = (valor) => {
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`
  }

  const formatarData = (data) => {
    if (!data) return '-'
    const partes = data.split('-')
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '4px' }}>
            📋 Lançamentos
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${lancamentos.length} lançamento(s) no banco de dados`}
          </p>
        </div>
        <button
          onClick={abrirModalNovo}
          style={{
            backgroundColor: '#2d8a4e',
            color: '#fff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1a6a3a'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2d8a4e'}
        >
          ➕ Novo Lançamento
        </button>
      </div>

      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        overflowX: 'auto'
      }}>
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
            <p>🔄 Carregando lançamentos...</p>
          </div>
        ) : lancamentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontSize: '18px' }}>Nenhum lançamento cadastrado</p>
            <p style={{ fontSize: '14px' }}>Clique em "Novo Lançamento" para começar</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Data</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Descrição</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Categoria</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Tipo</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Valor</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{formatarData(item.data)}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{item.descricao}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      {item.categoria}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      backgroundColor: item.tipo === 'receita' ? 'rgba(45,138,78,0.2)' : 'rgba(217,74,74,0.2)',
                      color: item.tipo === 'receita' ? '#2d8a4e' : '#d94a4a',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {item.tipo === 'receita' ? '📈 Receita' : '📉 Despesa'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    fontSize: '14px', 
                    textAlign: 'right',
                    fontWeight: '600',
                    color: item.tipo === 'receita' ? '#2d8a4e' : '#d94a4a'
                  }}>
                    {item.tipo === 'receita' ? '+' : '-'} {formatarValor(item.valor)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => abrirModalEditar(item)}
                      style={{
                        backgroundColor: 'rgba(58,122,189,0.2)',
                        color: '#3a7abd',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginRight: '8px'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleExcluir(item.id, item.descricao)}
                      style={{
                        backgroundColor: 'rgba(217,74,74,0.2)',
                        color: '#d94a4a',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={fecharModal}
        >
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              {modalEdicao ? '✏️ Editar Lançamento' : '➕ Novo Lançamento'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicao ? 'Atualize os dados do lançamento' : 'Preencha os dados da transação'}
            </p>

            <form onSubmit={salvarLancamento}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  📅 Data
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  📝 Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Salário, Aluguel, Supermercado..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  🏷️ Categoria
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat} style={{ backgroundColor: '#1a2b4a' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  📊 Tipo
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'receita' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: formData.tipo === 'receita' ? 'rgba(45,138,78,0.2)' : 'rgba(255,255,255,0.05)',
                      color: formData.tipo === 'receita' ? '#2d8a4e' : 'rgba(255,255,255,0.4)',
                      border: formData.tipo === 'receita' ? '1px solid #2d8a4e' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    📈 Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'despesa' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: formData.tipo === 'despesa' ? 'rgba(217,74,74,0.2)' : 'rgba(255,255,255,0.05)',
                      color: formData.tipo === 'despesa' ? '#d94a4a' : 'rgba(255,255,255,0.4)',
                      border: formData.tipo === 'despesa' ? '1px solid #d94a4a' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    📉 Despesa
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  💰 Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={fecharModal}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#2d8a4e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {modalEdicao ? '💾 Atualizar' : '➕ Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Lancamentos