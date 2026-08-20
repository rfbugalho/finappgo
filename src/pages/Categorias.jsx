import React, { useState, useEffect } from 'react'
import { 
  buscarCategorias, 
  adicionarCategoria, 
  atualizarCategoria, 
  excluirCategoria 
} from '../firebase/categoriasService'

function Categorias() {
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEdicao, setModalEdicao] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    tipo: 'despesa',
    subcategorias: []
  })

  const [subcategoriaInput, setSubcategoriaInput] = useState('')
  const [categoriaEditando, setCategoriaEditando] = useState(null)

  // Carregar categorias
  const carregarCategorias = async () => {
    setCarregando(true)
    const dados = await buscarCategorias()
    setCategorias(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarCategorias()
  }, [])

  // Abrir modal de nova categoria
  const abrirModalNovo = () => {
    setFormData({
      id: null,
      nome: '',
      tipo: 'despesa',
      subcategorias: []
    })
    setCategoriaEditando(null)
    setModalEdicao(false)
    setModalAberto(true)
  }

  // Abrir modal de edição
  const abrirModalEditar = (categoria) => {
    setFormData({
      id: categoria.id,
      nome: categoria.nome,
      tipo: categoria.tipo,
      subcategorias: categoria.subcategorias || []
    })
    setCategoriaEditando(categoria.id)
    setModalEdicao(true)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setFormData({
      id: null,
      nome: '',
      tipo: 'despesa',
      subcategorias: []
    })
    setCategoriaEditando(null)
  }

  // Salvar categoria
  const salvarCategoria = async (e) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      alert('Por favor, insira um nome para a categoria.')
      return
    }

    try {
      if (modalEdicao) {
        await atualizarCategoria(formData.id, {
          nome: formData.nome,
          tipo: formData.tipo,
          subcategorias: formData.subcategorias
        })
      } else {
        await adicionarCategoria({
          nome: formData.nome,
          tipo: formData.tipo,
          subcategorias: []
        })
      }
      
      await carregarCategorias()
      fecharModal()
    } catch (error) {
      alert('Erro ao salvar categoria.')
      console.error(error)
    }
  }

  // Excluir categoria
  const excluirCategoria = async (id, nome) => {
    if (window.confirm(`Excluir "${nome}"?`)) {
      try {
        await excluirCategoria(id)
        await carregarCategorias()
      } catch (error) {
        alert('Erro ao excluir.')
      }
    }
  }

  // Adicionar subcategoria
  const adicionarSubcategoria = () => {
    if (!subcategoriaInput.trim()) return
    if (formData.subcategorias.includes(subcategoriaInput.trim())) {
      alert('Subcategoria já existe!')
      return
    }
    setFormData({
      ...formData,
      subcategorias: [...formData.subcategorias, subcategoriaInput.trim()]
    })
    setSubcategoriaInput('')
  }

  // Remover subcategoria
  const removerSubcategoria = (index) => {
    const novas = formData.subcategorias.filter((_, i) => i !== index)
    setFormData({ ...formData, subcategorias: novas })
  }

  return (
    <div>
      {/* CABEÇALHO */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#ffffff' }}>📂 Categorias</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            {carregando ? 'Carregando...' : `${categorias.length} categoria(s)`}
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
            cursor: 'pointer'
          }}
        >
          ➕ Nova Categoria
        </button>
      </div>

      {/* LISTA */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Carregando...</p>
        ) : categorias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma categoria cadastrada</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
              Clique em "Nova Categoria" para começar
            </p>
          </div>
        ) : (
          categorias.map(cat => (
            <div key={cat.id} style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '10px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>
                    {cat.nome}
                  </span>
                  <span style={{
                    backgroundColor: cat.tipo === 'receita' ? 'rgba(45,138,78,0.2)' : 'rgba(217,74,74,0.2)',
                    color: cat.tipo === 'receita' ? '#2d8a4e' : '#d94a4a',
                    padding: '2px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    marginLeft: '10px'
                  }}>
                    {cat.tipo === 'receita' ? '📈 Receita' : '📉 Despesa'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '10px' }}>
                    {cat.subcategorias?.length || 0} subcategorias
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => abrirModalEditar(cat)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.6)',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => excluirCategoria(cat.id, cat.nome)}
                    style={{
                      backgroundColor: 'rgba(217,74,74,0.2)',
                      color: '#d94a4a',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {/* Subcategorias */}
              {cat.subcategorias && cat.subcategorias.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {cat.subcategorias.map((sub, idx) => (
                    <span key={idx} style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.6)'
                    }}>
                      • {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
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
          zIndex: 1000
        }}
        onClick={fecharModal}
        >
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>
              {modalEdicao ? '✏️ Editar Categoria' : '➕ Nova Categoria'}
            </h2>

            <form onSubmit={salvarCategoria}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                >
                  <option value="despesa" style={{ backgroundColor: '#1a2b4a' }}>📉 Despesa</option>
                  <option value="receita" style={{ backgroundColor: '#1a2b4a' }}>📈 Receita</option>
                </select>
              </div>

              {/* Subcategorias */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Subcategorias
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={subcategoriaInput}
                    onChange={(e) => setSubcategoriaInput(e.target.value)}
                    placeholder="Digite uma subcategoria..."
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={adicionarSubcategoria}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#3a7abd',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.subcategorias.map((sub, idx) => (
                    <span key={idx} style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {sub}
                      <button
                        type="button"
                        onClick={() => removerSubcategoria(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.3)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
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
                    cursor: 'pointer'
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

export default Categorias