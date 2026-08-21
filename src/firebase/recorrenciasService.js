import React, { useState, useEffect } from 'react'
import { 
  buscarRecorrencias, 
  adicionarRecorrencia, 
  atualizarRecorrencia, 
  excluirRecorrencia,
  gerarLancamentoRecorrente,
  processarRecorrencias
} from '../firebase/recorrenciasService'
import { buscarCategorias } from '../firebase/categoriasService'
import { buscarContasAtivas } from '../firebase/contasService'

function Recorrencias() {
  const [recorrencias, setRecorrencias] = useState([])
  const [categorias, setCategorias] = useState([])
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoCategorias, setCarregandoCategorias] = useState(true)
  const [carregandoContas, setCarregandoContas] = useState(true)

  // ==========================================
  // MODAL RECORRÊNCIA
  // ==========================================
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEdicao, setModalEdicao] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    valor: '',
    categoria: '',
    subcategoria: '',
    contaId: '',
    periodicidade: 'mensal',
    diaVencimento: '1',
    dataInicio: new Date().toISOString().split('T')[0],
    descricao: ''
  })

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarRecorrencias = async () => {
    setCarregando(true)
    const dados = await buscarRecorrencias()
    setRecorrencias(dados)
    setCarregando(false)
  }

  const carregarCategorias = async () => {
    setCarregandoCategorias(true)
    const dados = await buscarCategorias()
    setCategorias(dados)
    setCarregandoCategorias(false)
  }

  const carregarContas = async () => {
    setCarregandoContas(true)
    const dados = await buscarContasAtivas()
    setContas(dados)
    setCarregandoContas(false)
  }

  useEffect(() => {
    carregarRecorrencias()
    carregarCategorias()
    carregarContas()
  }, [])

  // ==========================================
  // FUNÇÕES DA RECORRÊNCIA
  // ==========================================
  const abrirModalNovo = () => {
    setFormData({
      id: null,
      nome: '',
      valor: '',
      categoria: '',
      subcategoria: '',
      contaId: '',
      periodicidade: 'mensal',
      diaVencimento: '1',
      dataInicio: new Date().toISOString().split('T')[0],
      descricao: ''
    })
    setModalEdicao(false)
    setModalAberto(true)
  }

  const abrirModalEditar = (recorrencia) => {
    setFormData({
      id: recorrencia.id,
      nome: recorrencia.nome,
      valor: recorrencia.valor,
      categoria: recorrencia.categoria,
      subcategoria: recorrencia.subcategoria || '',
      contaId: recorrencia.contaId || '',
      periodicidade: recorrencia.periodicidade,
      diaVencimento: recorrencia.diaVencimento || '1',
      dataInicio: recorrencia.dataInicio,
      descricao: recorrencia.descricao || ''
    })
    setModalEdicao(true)
    setModalAberto(true)
  }

  const salvarRecorrencia = async (e) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      alert('Digite um nome para a recorrência.')
      return
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      alert('Digite um valor válido.')
      return
    }

    if (!formData.categoria) {
      alert('Selecione uma categoria.')
      return
    }

    if (!formData.contaId) {
      alert('Selecione uma conta.')
      return
    }

    const dadosParaSalvar = {
      nome: formData.nome.trim(),
      valor: parseFloat(formData.valor),
      categoria: formData.categoria,
      subcategoria: formData.subcategoria || '',
      contaId: formData.contaId,
      periodicidade: formData.periodicidade,
      diaVencimento: formData.diaVencimento,
      dataInicio: formData.dataInicio,
      descricao: formData.descricao || ''
    }

    try {
      if (modalEdicao) {
        await atualizarRecorrencia(formData.id, dadosParaSalvar)
      } else {
        await adicionarRecorrencia(dadosParaSalvar)
      }
      
      await carregarRecorrencias()
      setModalAberto(false)
    } catch (error) {
      alert('Erro ao salvar recorrência.')
      console.error(error)
    }
  }

  const excluirRecorrencia = async (id, nome) => {
    if (window.confirm(`Excluir a recorrência "${nome}"?`)) {
      await excluirRecorrencia(id)
      await carregarRecorrencias()
    }
  }

  const gerarAgora = async (id) => {
    if (window.confirm('Gerar lançamento agora?')) {
      await gerarLancamentoRecorrente(id)
      await carregarRecorrencias()
      alert('Lançamento gerado com sucesso!')
    }
  }

  const processarTodas = async () => {
    if (window.confirm('Processar todas as recorrências pendentes?')) {
      await processarRecorrencias()
      await carregarRecorrencias()
      alert('Recorrências processadas!')
    }
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

  const getPeriodicidadeLabel = (periodicidade) => {
    const labels = {
      mensal: '📅 Mensal',
      semanal: '📆 Semanal',
      anual: '📅 Anual'
    }
    return labels[periodicidade] || periodicidade
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
            🔄 Contas Fixas (Recorrências)
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${recorrencias.length} recorrência(s) cadastrada(s)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={processarTodas}
            style={{
              backgroundColor: 'rgba(58,122,189,0.2)',
              color: '#3a7abd',
              border: '1px solid rgba(58,122,189,0.2)',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Processar Todas
          </button>
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
            ➕ Nova Recorrência
          </button>
        </div>
      </div>

      {/* LISTA DE RECORRÊNCIAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center' }}>
            Carregando recorrências...
          </p>
        ) : recorrencias.length === 0 ? (
          <div style={{ 
            gridColumn: '1/-1', 
            textAlign: 'center', 
            padding: '40px 0',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma recorrência cadastrada</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
              Clique em "Nova Recorrência" para começar
            </p>
          </div>
        ) : (
          recorrencias.map(recorrencia => (
            <div key={recorrencia.id} style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${recorrencia.status === 'ativo' ? 'rgba(45,138,78,0.2)' : 'rgba(217,74,74,0.2)'}`,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '16px', margin: '0 0 4px 0' }}>
                    {recorrencia.nome}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>
                    {getPeriodicidadeLabel(recorrencia.periodicidade)} · {recorrencia.categoria}
                  </p>
                  {recorrencia.subcategoria && (
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '2px 0 0 0' }}>
                      {recorrencia.subcategoria}
                    </p>
                  )}
                </div>
                <div>
                  <span style={{
                    backgroundColor: recorrencia.status === 'ativo' 
                      ? 'rgba(45,138,78,0.2)' 
                      : 'rgba(217,74,74,0.2)',
                    color: recorrencia.status === 'ativo' ? '#2d8a4e' : '#d94a4a',
                    padding: '2px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {recorrencia.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Valor</span>
                  <span style={{ color: '#fc8181', fontWeight: '600', fontSize: '16px' }}>
                    {formatarMoeda(recorrencia.valor)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                    Próximo vencimento
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                    {formatarData(recorrencia.proximoVencimento)}
                  </span>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                marginTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '12px'
              }}>
                <button
                  onClick={() => gerarAgora(recorrencia.id)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(45,138,78,0.2)',
                    color: '#2d8a4e',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  ⚡ Gerar Agora
                </button>
                <button
                  onClick={() => abrirModalEditar(recorrencia)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.6)',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => excluirRecorrencia(recorrencia.id, recorrencia.nome)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(217,74,74,0.2)',
                    color: '#d94a4a',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==========================================
          MODAL - RECORRÊNCIA
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
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              {modalEdicao ? '✏️ Editar Recorrência' : '🔄 Nova Recorrência'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicao ? 'Atualize os dados da recorrência' : 'Cadastre uma nova conta fixa'}
            </p>

            <form onSubmit={salvarRecorrencia}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Nome da Recorrência *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aluguel, Internet, Academia..."
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  💰 Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    📅 Periodicidade
                  </label>
                  <select
                    value={formData.periodicidade}
                    onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value })}
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
                    <option value="mensal">📅 Mensal</option>
                    <option value="semanal">📆 Semanal</option>
                    <option value="anual">📅 Anual</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    Dia de Vencimento
                  </label>
                  <select
                    value={formData.diaVencimento}
                    onChange={(e) => setFormData({ ...formData, diaVencimento: e.target.value })}
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
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  📅 Data de Início
                </label>
                <input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
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
                  🏷️ Categoria *
                </label>
                {carregandoCategorias ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
                ) : (
                  <select
                    value={formData.categoria}
                    onChange={(e) => {
                      const cat = categorias.find(c => c.nome === e.target.value)
                      setFormData({ 
                        ...formData, 
                        categoria: e.target.value,
                        subcategoria: ''
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
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.filter(c => c.tipo === 'despesa').map(cat => (
                      <option key={cat.id} value={cat.nome} style={{ backgroundColor: '#1a2b4a' }}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subcategoria */}
              {formData.categoria && (
                (() => {
                  const cat = categorias.find(c => c.nome === formData.categoria)
                  const subcategorias = cat?.subcategorias || []
                  return subcategorias.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                        🔹 Subcategoria
                      </label>
                      <select
                        value={formData.subcategoria}
                        onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
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
                        <option value="">Selecione uma subcategoria</option>
                        {subcategorias.map((sub, idx) => (
                          <option key={idx} value={sub} style={{ backgroundColor: '#1a2b4a' }}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })()
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  🏦 Conta *
                </label>
                {carregandoContas ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
                ) : (
                  <select
                    value={formData.contaId}
                    onChange={(e) => setFormData({ ...formData, contaId: e.target.value })}
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
                  >
                    <option value="">Selecione uma conta</option>
                    {contas.map(conta => (
                      <option key={conta.id} value={conta.id} style={{ backgroundColor: '#1a2b4a' }}>
                        {conta.logo || '🏦'} {conta.nomeExibicao || conta.instituicao}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  📝 Descrição (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pagamento do aluguel..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
    </div>
  )
}

export default Recorrencias