import React, { useState, useEffect } from 'react'
import { 
  buscarMetas, 
  adicionarMeta, 
  atualizarMeta, 
  excluirMeta,
  atualizarProgressoMeta
} from '../firebase/metasService'

function Metas() {
  const [metas, setMetas] = useState([])
  const [carregando, setCarregando] = useState(true)
  
  // Modal Meta
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEdicao, setModalEdicao] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    valorAlvo: '',
    valorAtual: 0,
    prazo: '',
    categoria: 'economia',
    cor: '#4299e1'
  })

  // Modal Progresso
  const [modalProgressoAberto, setModalProgressoAberto] = useState(false)
  const [metaProgresso, setMetaProgresso] = useState(null)
  const [valorProgresso, setValorProgresso] = useState('')

  const categorias = [
    { nome: 'Economia', emoji: '💰', cor: '#4299e1' },
    { nome: 'Viagem', emoji: '✈️', cor: '#48bb78' },
    { nome: 'Carro', emoji: '🚗', cor: '#ed8936' },
    { nome: 'Casa', emoji: '🏠', cor: '#9f7aea' },
    { nome: 'Saúde', emoji: '💪', cor: '#fc8181' },
    { nome: 'Educação', emoji: '📚', cor: '#f6ad55' },
    { nome: 'Investimento', emoji: '📈', cor: '#68d391' },
    { nome: 'Outro', emoji: '🎯', cor: '#718096' }
  ]

  const cores = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#fc8181', '#f6ad55', '#68d391', '#718096']

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarMetas = async () => {
    setCarregando(true)
    const dados = await buscarMetas()
    setMetas(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarMetas()
  }, [])

  // ==========================================
  // FUNÇÕES DA META
  // ==========================================
  const abrirModalNovo = () => {
    setFormData({
      id: null,
      nome: '',
      valorAlvo: '',
      valorAtual: 0,
      prazo: '',
      categoria: 'economia',
      cor: '#4299e1'
    })
    setModalEdicao(false)
    setModalAberto(true)
  }

  const abrirModalEditar = (meta) => {
    setFormData({
      id: meta.id,
      nome: meta.nome,
      valorAlvo: meta.valorAlvo,
      valorAtual: meta.valorAtual || 0,
      prazo: meta.prazo,
      categoria: meta.categoria || 'economia',
      cor: meta.cor || '#4299e1'
    })
    setModalEdicao(true)
    setModalAberto(true)
  }

  const salvarMeta = async (e) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      alert('Digite um nome para a meta.')
      return
    }

    if (!formData.valorAlvo || parseFloat(formData.valorAlvo) <= 0) {
      alert('Digite um valor alvo válido.')
      return
    }

    if (!formData.prazo) {
      alert('Selecione uma data de prazo.')
      return
    }

    const dadosParaSalvar = {
      nome: formData.nome.trim(),
      valorAlvo: parseFloat(formData.valorAlvo),
      valorAtual: parseFloat(formData.valorAtual) || 0,
      prazo: formData.prazo,
      categoria: formData.categoria,
      cor: formData.cor || '#4299e1',
      status: 'em_andamento'
    }

    try {
      if (modalEdicao) {
        await atualizarMeta(formData.id, dadosParaSalvar)
      } else {
        await adicionarMeta(dadosParaSalvar)
      }
      
      await carregarMetas()
      setModalAberto(false)
    } catch (error) {
      alert('Erro ao salvar meta. Tente novamente.')
      console.error(error)
    }
  }

  const excluirMeta = async (id, nome) => {
    if (window.confirm(`Excluir a meta "${nome}"?`)) {
      await excluirMeta(id)
      await carregarMetas()
    }
  }

  // ==========================================
  // FUNÇÕES DE PROGRESSO
  // ==========================================
  const abrirModalProgresso = (meta) => {
    setMetaProgresso(meta)
    setValorProgresso(meta.valorAtual || 0)
    setModalProgressoAberto(true)
  }

  const salvarProgresso = async () => {
    const valor = parseFloat(valorProgresso)
    if (isNaN(valor) || valor < 0) {
      alert('Digite um valor válido.')
      return
    }

    await atualizarProgressoMeta(metaProgresso.id, valor)
    await carregarMetas()
    setModalProgressoAberto(false)
  }

  // ==========================================
  // FORMATADORES
  // ==========================================
  const formatarMoeda = (valor) => {
    return `R$ ${(valor || 0).toFixed(2).replace('.', ',')}`
  }

  const formatarData = (data) => {
    if (!data) return '-'
    const partes = data.split('-')
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'concluida': return '✅ Concluída'
      case 'atrasada': return '⚠️ Atrasada'
      default: return '🔄 Em andamento'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'concluida': return '#48bb78'
      case 'atrasada': return '#fc8181'
      default: return '#4299e1'
    }
  }

  const getCategoriaEmoji = (categoria) => {
    const cat = categorias.find(c => c.nome.toLowerCase() === categoria?.toLowerCase())
    return cat?.emoji || '🎯'
  }

  return (
    <div>
      {/* CABEÇALHO */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '4px' }}>
            🎯 Metas Financeiras
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${metas.length} meta(s) cadastrada(s)`}
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Nova Meta
        </button>
      </div>

      {/* LISTA DE METAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center' }}>
            Carregando metas...
          </p>
        ) : metas.length === 0 ? (
          <div style={{ 
            gridColumn: '1/-1', 
            textAlign: 'center', 
            padding: '40px 0',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma meta cadastrada</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
              Clique em "Nova Meta" para começar
            </p>
          </div>
        ) : (
          metas.map(meta => {
            const progresso = meta.progresso || 0
            const statusColor = getStatusColor(meta.status)

            return (
              <div key={meta.id} style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '20px',
                border: `1px solid ${statusColor}33`,
                transition: 'transform 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {/* Barra colorida no topo */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: meta.cor || '#4299e1'
                }} />

                {/* Cabeçalho */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '8px' }}>
                  <div>
                    <span style={{ fontSize: '28px', marginRight: '8px' }}>
                      {getCategoriaEmoji(meta.categoria)}
                    </span>
                    <h3 style={{ 
                      color: '#fff', 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      margin: '8px 0 4px 0'
                    }}>
                      {meta.nome}
                    </h3>
                    <p style={{ 
                      color: 'rgba(255,255,255,0.3)', 
                      fontSize: '12px',
                      margin: 0,
                      textTransform: 'capitalize'
                    }}>
                      {meta.categoria} · Prazo: {formatarData(meta.prazo)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => abrirModalEditar(meta)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.6)',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => excluirMeta(meta.id, meta.nome)}
                      style={{
                        backgroundColor: 'rgba(217,74,74,0.2)',
                        color: '#d94a4a',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div style={{ marginTop: '12px' }}>
                  <span style={{
                    backgroundColor: `${statusColor}22`,
                    color: statusColor,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {getStatusText(meta.status)}
                  </span>
                </div>

                {/* Valores */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                      Progresso
                    </span>
                    <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                      {formatarMoeda(meta.valorAtual || 0)} / {formatarMoeda(meta.valorAlvo)}
                    </span>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '4px'
                  }}>
                    <div style={{
                      width: `${Math.min(progresso, 100)}%`,
                      height: '100%',
                      backgroundColor: meta.cor || '#4299e1',
                      borderRadius: '4px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.2)', 
                    fontSize: '11px',
                    margin: '4px 0 0 0',
                    textAlign: 'right'
                  }}>
                    {progresso.toFixed(1)}% concluído
                  </p>
                </div>

                {/* Botão de ação */}
                <div style={{ 
                  marginTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: '12px'
                }}>
                  <button
                    onClick={() => abrirModalProgresso(meta)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(58,122,189,0.2)',
                      color: '#3a7abd',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(58,122,189,0.4)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(58,122,189,0.2)'}
                  >
                    📈 Atualizar Progresso
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ==========================================
          MODAL - META
          ========================================== */}
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
        }} onClick={() => setModalAberto(false)}>
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              {modalEdicao ? '✏️ Editar Meta' : '🎯 Nova Meta'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicao ? 'Atualize os dados da meta' : 'Defina um novo objetivo financeiro'}
            </p>

            <form onSubmit={salvarMeta}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Nome da Meta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Juntar para viagem, Pagar dívida..."
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Categoria
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => {
                    const cat = categorias.find(c => c.nome.toLowerCase() === e.target.value)
                    setFormData({ 
                      ...formData, 
                      categoria: e.target.value,
                      cor: cat?.cor || '#4299e1'
                    })
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                >
                  {categorias.map(cat => (
                    <option key={cat.nome} value={cat.nome.toLowerCase()} style={{ backgroundColor: '#1a2b4a' }}>
                      {cat.emoji} {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  💰 Valor Alvo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valorAlvo}
                  onChange={(e) => setFormData({ ...formData, valorAlvo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              {modalEdicao && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    💰 Valor Atual (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valorAtual}
                    onChange={(e) => setFormData({ ...formData, valorAtual: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#ffffff'
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📅 Prazo
                </label>
                <input
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
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

      {/* ==========================================
          MODAL - PROGRESSO
          ========================================== */}
      {modalProgressoAberto && metaProgresso && (
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
        }} onClick={() => setModalProgressoAberto(false)}>
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '420px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              📈 Atualizar Progresso
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              Meta: {metaProgresso.nome}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  Valor Atual
                </span>
                <span style={{ color: '#fff', fontWeight: '600' }}>
                  {formatarMoeda(metaProgresso.valorAtual || 0)} / {formatarMoeda(metaProgresso.valorAlvo)}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(metaProgresso.progresso || 0, 100)}%`,
                  height: '100%',
                  backgroundColor: metaProgresso.cor || '#4299e1',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <p style={{ 
                color: 'rgba(255,255,255,0.2)', 
                fontSize: '11px',
                margin: '4px 0 0 0',
                textAlign: 'right'
              }}>
                {(metaProgresso.progresso || 0).toFixed(1)}% concluído
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                💰 Valor Acumulado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorProgresso}
                onChange={(e) => setValorProgresso(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#ffffff'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setModalProgressoAberto(false)}
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
                onClick={salvarProgresso}
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
                💾 Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Metas