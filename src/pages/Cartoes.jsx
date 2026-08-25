import React, { useState, useEffect } from 'react'
import { 
  buscarCartoes, 
  adicionarCartao, 
  atualizarCartao, 
  excluirCartao as excluirCartaoService,
  buscarDespesasCartao,
  adicionarDespesaCartao,
  atualizarDespesaCartao,
  excluirDespesaCartao
} from '../firebase/cartoesService'

function Cartoes() {
  const [cartoes, setCartoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null)
  const [despesas, setDespesas] = useState([])
  const [mostrarDespesas, setMostrarDespesas] = useState(false)

  // Modal Cartão
  const [modalCartaoAberto, setModalCartaoAberto] = useState(false)
  const [modalEdicaoCartao, setModalEdicaoCartao] = useState(false)
  const [formCartao, setFormCartao] = useState({
    id: null,
    nome: '',
    bandeira: 'visa',
    limiteTotal: '',
    dataFechamento: '10',
    dataVencimento: '25'
  })

  // Modal Despesa
  const [modalDespesaAberto, setModalDespesaAberto] = useState(false)
  const [modalEdicaoDespesa, setModalEdicaoDespesa] = useState(false)
  const [formDespesa, setFormDespesa] = useState({
    id: null,
    cartaoId: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: '',
    parcelado: false,
    totalParcelas: 1,
    parcelaAtual: 1
  })

  const bandeiras = [
    { nome: 'Visa', emoji: '💳' },
    { nome: 'Mastercard', emoji: '💳' },
    { nome: 'American Express', emoji: '💳' },
    { nome: 'Elo', emoji: '💳' },
    { nome: 'Andorinha', emoji: '💳' },
    { nome: 'Trimais', emoji: '💳' },
    { nome: 'Outro', emoji: '💳' }
  ]

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarCartoes = async () => {
    setCarregando(true)
    const dados = await buscarCartoes()
    setCartoes(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarCartoes()
  }, [])

  // ==========================================
  // FUNÇÕES DO CARTÃO
  // ==========================================
  const abrirModalNovoCartao = () => {
    setFormCartao({
      id: null,
      nome: '',
      bandeira: 'visa',
      limiteTotal: '',
      dataFechamento: '10',
      dataVencimento: '25'
    })
    setModalEdicaoCartao(false)
    setModalCartaoAberto(true)
  }

  const abrirModalEditarCartao = (cartao) => {
    setFormCartao({
      id: cartao.id,
      nome: cartao.nome,
      bandeira: cartao.bandeira,
      limiteTotal: cartao.limiteTotal,
      dataFechamento: cartao.dataFechamento,
      dataVencimento: cartao.dataVencimento
    })
    setModalEdicaoCartao(true)
    setModalCartaoAberto(true)
  }

  const salvarCartao = async (e) => {
    e.preventDefault()
    
    if (!formCartao.nome.trim()) {
      alert('Digite o nome do cartão.')
      return
    }

    if (!formCartao.limiteTotal || parseFloat(formCartao.limiteTotal) <= 0) {
      alert('Digite um limite total válido.')
      return
    }

    const dadosParaSalvar = {
      nome: formCartao.nome.trim(),
      bandeira: formCartao.bandeira,
      limiteTotal: parseFloat(formCartao.limiteTotal),
      limiteDisponivel: parseFloat(formCartao.limiteTotal),
      dataFechamento: formCartao.dataFechamento,
      dataVencimento: formCartao.dataVencimento,
      status: 'ativo'
    }

    try {
      if (modalEdicaoCartao) {
        await atualizarCartao(formCartao.id, dadosParaSalvar)
      } else {
        await adicionarCartao(dadosParaSalvar)
      }
      
      await carregarCartoes()
      setModalCartaoAberto(false)
    } catch (error) {
      alert('Erro ao salvar cartão. Tente novamente.')
      console.error(error)
    }
  }

  // ==========================================
  // FUNÇÃO EXCLUIR CORRIGIDA
  // ==========================================
  const excluirCartao = async (id, nome) => {
    if (window.confirm(`Excluir o cartão "${nome || 'selecionado'}"?`)) {
      try {
        await excluirCartaoService(id)
        await carregarCartoes()
      } catch (error) {
        alert('Erro ao excluir cartão. Tente novamente.')
        console.error(error)
      }
    }
  }

  // ==========================================
  // FUNÇÕES DE DESPESA
  // ==========================================
  const verDespesas = async (cartaoId) => {
    const cartao = cartoes.find(c => c.id === cartaoId)
    setCartaoSelecionado(cartao)
    const dados = await buscarDespesasCartao(cartaoId)
    setDespesas(dados)
    setMostrarDespesas(true)
  }

  const abrirModalNovaDespesa = (cartaoId) => {
    setFormDespesa({
      id: null,
      cartaoId: cartaoId,
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      valor: '',
      parcelado: false,
      totalParcelas: 1,
      parcelaAtual: 1
    })
    setModalEdicaoDespesa(false)
    setModalDespesaAberto(true)
  }

  const abrirModalEditarDespesa = (despesa) => {
    setFormDespesa({
      id: despesa.id,
      cartaoId: despesa.cartaoId,
      data: despesa.data,
      descricao: despesa.descricao,
      valor: despesa.valor,
      parcelado: despesa.parcelado || false,
      totalParcelas: despesa.totalParcelas || 1,
      parcelaAtual: despesa.parcelaAtual || 1
    })
    setModalEdicaoDespesa(true)
    setModalDespesaAberto(true)
  }

  const salvarDespesa = async (e) => {
    e.preventDefault()
    
    const valorNumero = parseFloat(formDespesa.valor)
    if (isNaN(valorNumero) || valorNumero <= 0) {
      alert('Digite um valor válido.')
      return
    }

    if (!formDespesa.descricao.trim()) {
      alert('Digite uma descrição para a despesa.')
      return
    }

    const dadosParaSalvar = {
      cartaoId: formDespesa.cartaoId,
      data: formDespesa.data,
      descricao: formDespesa.descricao.trim(),
      valor: valorNumero,
      parcelado: formDespesa.parcelado,
      totalParcelas: formDespesa.parcelado ? formDespesa.totalParcelas : 1
    }

    try {
      if (modalEdicaoDespesa) {
        await atualizarDespesaCartao(formDespesa.id, dadosParaSalvar)
      } else {
        await adicionarDespesaCartao(dadosParaSalvar)
      }
      
      if (formDespesa.cartaoId) {
        const dados = await buscarDespesasCartao(formDespesa.cartaoId)
        setDespesas(dados)
      }
      await carregarCartoes()
      setModalDespesaAberto(false)
    } catch (error) {
      alert('Erro ao salvar despesa. Tente novamente.')
      console.error(error)
    }
  }

  const excluirDespesa = async (id, cartaoId) => {
    if (window.confirm('Excluir esta despesa?')) {
      await excluirDespesaCartao(id, cartaoId)
      const dados = await buscarDespesasCartao(cartaoId)
      setDespesas(dados)
      await carregarCartoes()
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

  const getBandeiraEmoji = (bandeira) => {
    const b = bandeiras.find(b => b.nome.toLowerCase() === bandeira?.toLowerCase())
    return b?.emoji || '💳'
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
            💳 Cartões de Crédito
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${cartoes.length} cartão(ões) cadastrado(s)`}
          </p>
        </div>
        <button
          onClick={abrirModalNovoCartao}
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
          ➕ Novo Cartão
        </button>
      </div>

      {/* LISTA DE CARTÕES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center' }}>
            Carregando cartões...
          </p>
        ) : cartoes.length === 0 ? (
          <div style={{ 
            gridColumn: '1/-1', 
            textAlign: 'center', 
            padding: '40px 0',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum cartão cadastrado</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
              Clique em "Novo Cartão" para começar
            </p>
          </div>
        ) : (
          cartoes.map(cartao => {
            const limiteDisponivel = cartao.limiteDisponivel || cartao.limiteTotal
            const percentualUsado = cartao.limiteTotal > 0 
              ? ((cartao.limiteTotal - limiteDisponivel) / cartao.limiteTotal * 100) 
              : 0

            return (
              <div key={cartao.id} style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {/* Cabeçalho do cartão */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '28px', marginRight: '8px' }}>
                      {getBandeiraEmoji(cartao.bandeira)}
                    </span>
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '8px 0 0 0' }}>
                      {cartao.nome}
                    </h3>
                    <p style={{ 
                      color: 'rgba(255,255,255,0.3)', 
                      fontSize: '12px',
                      margin: '2px 0 0 0',
                      textTransform: 'capitalize'
                    }}>
                      {cartao.bandeira} · Fecha {cartao.dataFechamento || '--'} · Vence {cartao.dataVencimento || '--'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => abrirModalEditarCartao(cartao)}
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
                      onClick={() => excluirCartao(cartao.id, cartao.nome)}
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

                {/* Limites */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Limite Disponível</span>
                    <span style={{ color: '#2d8a4e', fontWeight: '700', fontSize: '16px' }}>
                      {formatarMoeda(limiteDisponivel)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Limite Total</span>
                    <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '14px' }}>
                      {formatarMoeda(cartao.limiteTotal)}
                    </span>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    marginTop: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(percentualUsado, 100)}%`,
                      height: '100%',
                      backgroundColor: percentualUsado > 80 ? '#d94a4a' : percentualUsado > 50 ? '#ed8936' : '#2d8a4e',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.2)', 
                    fontSize: '10px',
                    margin: '4px 0 0 0',
                    textAlign: 'right'
                  }}>
                    {percentualUsado.toFixed(1)}% utilizado
                  </p>
                </div>

                {/* Botões de ação */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: '12px'
                }}>
                  <button
                    onClick={() => verDespesas(cartao.id)}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(58,122,189,0.2)',
                      color: '#3a7abd',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    📋 Ver Fatura
                  </button>
                  <button
                    onClick={() => abrirModalNovaDespesa(cartao.id)}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(45,138,78,0.2)',
                      color: '#2d8a4e',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ Lançar Despesa
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ==========================================
          MODAL - CARTÃO
          ========================================== */}
      {modalCartaoAberto && (
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
        }} onClick={() => setModalCartaoAberto(false)}>
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
              {modalEdicaoCartao ? '✏️ Editar Cartão' : '➕ Novo Cartão'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicaoCartao ? 'Atualize os dados do cartão' : 'Cadastre um novo cartão de crédito'}
            </p>

            <form onSubmit={salvarCartao}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Nome do Cartão
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Itaú Visa..."
                  value={formCartao.nome}
                  onChange={(e) => setFormCartao({ ...formCartao, nome: e.target.value })}
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
                  Bandeira
                </label>
                <select
                  value={formCartao.bandeira}
                  onChange={(e) => setFormCartao({ ...formCartao, bandeira: e.target.value })}
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
                  {bandeiras.map(b => (
                    <option key={b.nome} value={b.nome.toLowerCase()} style={{ backgroundColor: '#1a2b4a' }}>
                      {b.emoji} {b.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  💰 Limite Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formCartao.limiteTotal}
                  onChange={(e) => setFormCartao({ ...formCartao, limiteTotal: e.target.value })}
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
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    📅 Dia Fechamento
                  </label>
                  <select
                    value={formCartao.dataFechamento}
                    onChange={(e) => setFormCartao({ ...formCartao, dataFechamento: e.target.value })}
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
                      <option key={d} value={d} style={{ backgroundColor: '#1a2b4a' }}>{d}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    📅 Dia Vencimento
                  </label>
                  <select
                    value={formCartao.dataVencimento}
                    onChange={(e) => setFormCartao({ ...formCartao, dataVencimento: e.target.value })}
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
                      <option key={d} value={d} style={{ backgroundColor: '#1a2b4a' }}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalCartaoAberto(false)}
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
                  {modalEdicaoCartao ? '💾 Atualizar' : '➕ Adicionar'}
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
            border: '1px solid rgba(255,255,255,0.08)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              {modalEdicaoDespesa ? '✏️ Editar Despesa' : '➕ Nova Despesa no Cartão'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicaoDespesa ? 'Atualize os dados da despesa' : 'Lançe uma despesa no cartão'}
            </p>

            <form onSubmit={salvarDespesa}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📝 Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Supermercado, Roupas..."
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
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={formDespesa.parcelado}
                    onChange={(e) => setFormDespesa({ ...formDespesa, parcelado: e.target.checked })}
                  />
                  Compra Parcelada
                </label>
              </div>

              {formDespesa.parcelado && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    Número de Parcelas
                  </label>
                  <select
                    value={formDespesa.totalParcelas}
                    onChange={(e) => setFormDespesa({ ...formDespesa, totalParcelas: parseInt(e.target.value) })}
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
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n} style={{ backgroundColor: '#1a2b4a' }}>{n}x</option>
                    ))}
                  </select>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px' }}>
                    Valor da parcela: {formatarMoeda(parseFloat(formDespesa.valor) / formDespesa.totalParcelas)}
                  </p>
                </div>
              )}

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

      {/* ==========================================
          MODAL - LISTA DE DESPESAS
          ========================================== */}
      {mostrarDespesas && cartaoSelecionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '20px'
        }} onClick={() => setMostrarDespesas(false)}>
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', color: '#ffffff', margin: 0 }}>
                  📋 Fatura - {cartaoSelecionado.nome}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  {despesas.length} despesa(s) · Limite Disponível: {formatarMoeda(cartaoSelecionado.limiteDisponivel)}
                </p>
              </div>
              <button
                onClick={() => setMostrarDespesas(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.6)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕ Fechar
              </button>
            </div>

            {despesas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma despesa neste cartão</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Data</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Descrição</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Valor</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Parcelas</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.map(despesa => (
                      <tr key={despesa.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{formatarData(despesa.data)}</td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{despesa.descricao}</td>
                        <td style={{ padding: '10px', fontSize: '13px', textAlign: 'right', color: '#d94a4a' }}>
                          - {formatarMoeda(despesa.valor)}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center' }}>
                          {despesa.parcelado ? (
                            <span style={{
                              backgroundColor: 'rgba(58,122,189,0.2)',
                              color: '#3a7abd',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }}>
                              {despesa.parcelaAtual || 1}/{despesa.totalParcelas}
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>À vista</span>
                          )}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            onClick={() => abrirModalEditarDespesa(despesa)}
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              color: 'rgba(255,255,255,0.6)',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginRight: '4px'
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => excluirDespesa(despesa.id, despesa.cartaoId)}
                            style={{
                              backgroundColor: 'rgba(217,74,74,0.2)',
                              color: '#d94a4a',
                              border: 'none',
                              padding: '4px 10px',
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
        </div>
      )}
    </div>
  )
}

export default Cartoes