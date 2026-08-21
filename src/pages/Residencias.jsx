import React, { useState, useEffect } from 'react'
import { 
  buscarResidencias, 
  adicionarResidencia, 
  atualizarResidencia, 
  excluirResidencia,
  buscarDespesasResidencia,
  adicionarDespesaResidencia,
  atualizarDespesaResidencia,
  excluirDespesaResidencia
} from '../firebase/residenciasService'

function Residencias() {
  // ==========================================
  // ESTADOS PRINCIPAIS
  // ==========================================
  const [residencias, setResidencias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [residenciaSelecionada, setResidenciaSelecionada] = useState(null)
  const [despesas, setDespesas] = useState([])
  const [abaAberta, setAbaAberta] = useState('despesas')

  // ==========================================
  // MODAL RESIDÊNCIA
  // ==========================================
  const [modalResidenciaAberto, setModalResidenciaAberto] = useState(false)
  const [modalEdicaoResidencia, setModalEdicaoResidencia] = useState(false)
  const [formResidencia, setFormResidencia] = useState({
    id: null,
    nome: '',
    endereco: '',
    tipo: 'casa',
    descricao: ''
  })

  // ==========================================
  // MODAL DESPESA
  // ==========================================
  const [modalDespesaAberto, setModalDespesaAberto] = useState(false)
  const [modalEdicaoDespesa, setModalEdicaoDespesa] = useState(false)
  const [formDespesa, setFormDespesa] = useState({
    id: null,
    residenciaId: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'agua',
    descricao: '',
    valor: ''
  })

  const tiposResidencia = ['casa', 'apartamento', 'terreno', 'sitio', 'comercial', 'outro']
  const tiposDespesa = ['agua', 'luz', 'internet', 'iptu', 'condominio', 'manutencao', 'outros']

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarResidencias = async () => {
    setCarregando(true)
    const dados = await buscarResidencias()
    setResidencias(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarResidencias()
  }, [])

  // ==========================================
  // FUNÇÕES DA RESIDÊNCIA
  // ==========================================
  const abrirModalNovaResidencia = () => {
    setFormResidencia({
      id: null,
      nome: '',
      endereco: '',
      tipo: 'casa',
      descricao: ''
    })
    setModalEdicaoResidencia(false)
    setModalResidenciaAberto(true)
  }

  const abrirModalEditarResidencia = (residencia) => {
    setFormResidencia({
      id: residencia.id,
      nome: residencia.nome,
      endereco: residencia.endereco,
      tipo: residencia.tipo,
      descricao: residencia.descricao || ''
    })
    setModalEdicaoResidencia(true)
    setModalResidenciaAberto(true)
  }

  const salvarResidencia = async (e) => {
    e.preventDefault()
    
    if (!formResidencia.nome.trim()) {
      alert('Digite um nome para a residência.')
      return
    }

    const dadosParaSalvar = {
      nome: formResidencia.nome.trim(),
      endereco: formResidencia.endereco,
      tipo: formResidencia.tipo,
      descricao: formResidencia.descricao
    }

    try {
      if (modalEdicaoResidencia) {
        await atualizarResidencia(formResidencia.id, dadosParaSalvar)
      } else {
        await adicionarResidencia(dadosParaSalvar)
      }
      
      await carregarResidencias()
      setModalResidenciaAberto(false)
    } catch (error) {
      alert('Erro ao salvar residência.')
      console.error(error)
    }
  }

  const excluirResidencia = async (id, nome) => {
    if (window.confirm(`Excluir a residência "${nome}"?`)) {
      await excluirResidencia(id)
      await carregarResidencias()
      if (residenciaSelecionada?.id === id) {
        setResidenciaSelecionada(null)
      }
    }
  }

  // ==========================================
  // FUNÇÕES DE DESPESA
  // ==========================================
  const carregarDespesas = async (residenciaId) => {
    const dados = await buscarDespesasResidencia(residenciaId)
    setDespesas(dados)
  }

  const abrirModalNovaDespesa = (residenciaId) => {
    setFormDespesa({
      id: null,
      residenciaId: residenciaId,
      data: new Date().toISOString().split('T')[0],
      tipo: 'agua',
      descricao: '',
      valor: ''
    })
    setModalEdicaoDespesa(false)
    setModalDespesaAberto(true)
  }

  const abrirModalEditarDespesa = (despesa) => {
    setFormDespesa({
      id: despesa.id,
      residenciaId: despesa.residenciaId,
      data: despesa.data,
      tipo: despesa.tipo,
      descricao: despesa.descricao,
      valor: despesa.valor
    })
    setModalEdicaoDespesa(true)
    setModalDespesaAberto(true)
  }

  const salvarDespesa = async (e) => {
    e.preventDefault()
    
    const valor = parseFloat(formDespesa.valor)
    if (isNaN(valor) || valor <= 0) {
      alert('Digite um valor válido.')
      return
    }

    const dadosParaSalvar = {
      residenciaId: formDespesa.residenciaId,
      data: formDespesa.data,
      tipo: formDespesa.tipo,
      descricao: formDespesa.descricao,
      valor: valor
    }

    try {
      if (modalEdicaoDespesa) {
        await atualizarDespesaResidencia(formDespesa.id, dadosParaSalvar)
      } else {
        await adicionarDespesaResidencia(dadosParaSalvar)
      }
      
      await carregarDespesas(formDespesa.residenciaId)
      setModalDespesaAberto(false)
    } catch (error) {
      alert('Erro ao salvar despesa.')
      console.error(error)
    }
  }

  const excluirDespesa = async (id, residenciaId) => {
    if (window.confirm('Excluir esta despesa?')) {
      await excluirDespesaResidencia(id, residenciaId)
      await carregarDespesas(residenciaId)
    }
  }

  // ==========================================
  // FUNÇÕES DE SELEÇÃO
  // ==========================================
  const selecionarResidencia = async (residencia) => {
    setResidenciaSelecionada(residencia)
    await carregarDespesas(residencia.id)
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

  const getTipoEmoji = (tipo) => {
    const emojis = {
      casa: '🏠',
      apartamento: '🏢',
      terreno: '🌳',
      sitio: '🌿',
      comercial: '🏪',
      outro: '📦'
    }
    return emojis[tipo] || '🏠'
  }

  const getDespesaEmoji = (tipo) => {
    const emojis = {
      agua: '💧',
      luz: '💡',
      internet: '🌐',
      iptu: '📋',
      condominio: '🏢',
      manutencao: '🔧',
      outros: '📦'
    }
    return emojis[tipo] || '📦'
  }

  // ==========================================
  // RENDER
  // ==========================================
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
            🏠 Residências
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${residencias.length} residência(s) cadastrada(s)`}
          </p>
        </div>
        <button
          onClick={abrirModalNovaResidencia}
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
          ➕ Nova Residência
        </button>
      </div>

      {/* LISTA DE RESIDÊNCIAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: residenciaSelecionada ? '1fr 2fr' : '1fr',
        gap: '20px'
      }}>
        {/* COLUNA ESQUERDA: LISTA DE RESIDÊNCIAS */}
        <div>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Carregando residências...</p>
          ) : residencias.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma residência cadastrada</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                Clique em "Nova Residência" para começar
              </p>
            </div>
          ) : (
            residencias.map(residencia => (
              <div 
                key={residencia.id} 
                onClick={() => selecionarResidencia(residencia)}
                style={{
                  backgroundColor: residenciaSelecionada?.id === residencia.id 
                    ? 'rgba(58,122,189,0.2)' 
                    : 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  border: residenciaSelecionada?.id === residencia.id 
                    ? '1px solid #3a7abd' 
                    : '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#fff', margin: 0 }}>
                      {getTipoEmoji(residencia.tipo)} {residencia.nome}
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '4px 0 0 0' }}>
                      {residencia.endereco || 'Endereço não cadastrado'}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '2px 0 0 0', textTransform: 'capitalize' }}>
                      {residencia.tipo}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); abrirModalEditarResidencia(residencia); }}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.6)',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginRight: '6px'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); excluirResidencia(residencia.id, residencia.nome); }}
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
              </div>
            ))
          )}
        </div>

        {/* COLUNA DIREITA: DETALHES DA RESIDÊNCIA */}
        {residenciaSelecionada && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {/* Cabeçalho da residência */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {getTipoEmoji(residenciaSelecionada.tipo)} {residenciaSelecionada.nome}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: '2px 0 0 0' }}>
                  {residenciaSelecionada.endereco || 'Endereço não cadastrado'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: '2px 0 0 0', textTransform: 'capitalize' }}>
                  {residenciaSelecionada.tipo}
                </p>
              </div>
              <button
                onClick={() => abrirModalNovaDespesa(residenciaSelecionada.id)}
                style={{
                  backgroundColor: 'rgba(45,138,78,0.2)',
                  color: '#2d8a4e',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                ➕ Nova Despesa
              </button>
            </div>

            {/* Resumo da residência */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px'
            }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>Total Despesas</p>
                <p style={{ color: '#fc8181', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  {formatarMoeda(despesas.reduce((acc, d) => acc + (d.valor || 0), 0))}
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>Despesas Registradas</p>
                <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  {despesas.length}
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>Ticket Médio</p>
                <p style={{ color: '#2d8a4e', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  {despesas.length > 0 
                    ? formatarMoeda(despesas.reduce((acc, d) => acc + d.valor, 0) / despesas.length)
                    : '--'
                  }
                </p>
              </div>
            </div>

            {/* Aba */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
              <button
                onClick={() => setAbaAberta('despesas')}
                style={{
                  padding: '8px 20px',
                  backgroundColor: 'transparent',
                  color: abaAberta === 'despesas' ? '#3a7abd' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  borderBottom: abaAberta === 'despesas' ? '2px solid #3a7abd' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                📋 Despesas
              </button>
            </div>

            {/* Conteúdo da aba - Despesas */}
            {abaAberta === 'despesas' && (
              <div>
                {despesas.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
                    Nenhuma despesa registrada
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'rgba(255,255,255,0.3)' }}>Data</th>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'rgba(255,255,255,0.3)' }}>Tipo</th>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'rgba(255,255,255,0.3)' }}>Descrição</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: 'rgba(255,255,255,0.3)' }}>Valor</th>
                          <th style={{ padding: '8px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {despesas.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px' }}>{formatarData(item.data)}</td>
                            <td style={{ padding: '8px' }}>
                              {getDespesaEmoji(item.tipo)} {item.tipo}
                            </td>
                            <td style={{ padding: '8px' }}>{item.descricao || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#fc8181' }}>
                              {formatarMoeda(item.valor)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                onClick={() => abrirModalEditarDespesa(item)}
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  color: 'rgba(255,255,255,0.6)',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  marginRight: '4px'
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => excluirDespesa(item.id, item.residenciaId)}
                                style={{
                                  backgroundColor: 'rgba(217,74,74,0.2)',
                                  color: '#d94a4a',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL - RESIDÊNCIA
          ========================================== */}
      {modalResidenciaAberto && (
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
        }} onClick={() => setModalResidenciaAberto(false)}>
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              {modalEdicaoResidencia ? '✏️ Editar Residência' : '🏠 Nova Residência'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicaoResidencia ? 'Atualize os dados da residência' : 'Cadastre uma nova residência'}
            </p>

            <form onSubmit={salvarResidencia}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Nome da Residência *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Casa Praia, Apartamento Centro..."
                  value={formResidencia.nome}
                  onChange={(e) => setFormResidencia({ ...formResidencia, nome: e.target.value })}
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  📍 Endereço
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rua das Flores, 123"
                  value={formResidencia.endereco}
                  onChange={(e) => setFormResidencia({ ...formResidencia, endereco: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    Tipo
                  </label>
                  <select
                    value={formResidencia.tipo}
                    onChange={(e) => setFormResidencia({ ...formResidencia, tipo: e.target.value })}
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
                    {tiposResidencia.map(t => (
                      <option key={t} value={t} style={{ backgroundColor: '#1a2b4a', textTransform: 'capitalize' }}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    📝 Descrição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Com 3 quartos, piscina..."
                    value={formResidencia.descricao}
                    onChange={(e) => setFormResidencia({ ...formResidencia, descricao: e.target.value })}
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
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalResidenciaAberto(false)}
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
                  {modalEdicaoResidencia ? '💾 Atualizar' : '➕ Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL - DESPESA
          ========================================== */}
      {modalDespesaAberto && (
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
        }} onClick={() => setModalDespesaAberto(false)}>
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
              {modalEdicaoDespesa ? '✏️ Editar Despesa' : '➕ Nova Despesa'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicaoDespesa ? 'Atualize os dados da despesa' : 'Registre uma nova despesa da residência'}
            </p>

            <form onSubmit={salvarDespesa}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  📅 Data
                </label>
                <input
                  type="date"
                  value={formDespesa.data}
                  onChange={(e) => setFormDespesa({ ...formDespesa, data: e.target.value })}
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Tipo de Despesa
                </label>
                <select
                  value={formDespesa.tipo}
                  onChange={(e) => setFormDespesa({ ...formDespesa, tipo: e.target.value })}
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
                  {tiposDespesa.map(t => (
                    <option key={t} value={t} style={{ backgroundColor: '#1a2b4a', textTransform: 'capitalize' }}>
                      {t === 'agua' ? '💧 Água' : 
                       t === 'luz' ? '💡 Luz' : 
                       t === 'internet' ? '🌐 Internet' : 
                       t === 'iptu' ? '📋 IPTU' : 
                       t === 'condominio' ? '🏢 Condomínio' : 
                       t === 'manutencao' ? '🔧 Manutenção' : '📦 Outros'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  📝 Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conta de água, Troca de telhado..."
                  value={formDespesa.descricao}
                  onChange={(e) => setFormDespesa({ ...formDespesa, descricao: e.target.value })}
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  💰 Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formDespesa.valor}
                  onChange={(e) => setFormDespesa({ ...formDespesa, valor: e.target.value })}
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
                  onClick={() => setModalDespesaAberto(false)}
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
                  {modalEdicaoDespesa ? '💾 Atualizar' : '➕ Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Residencias