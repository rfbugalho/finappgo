import React, { useState, useEffect } from 'react'
import { 
  buscarCartoes, 
  adicionarCartao, 
  atualizarCartao, 
  excluirCartao,
  buscarDespesasCartao,
  adicionarDespesaCartao,
  atualizarDespesaCartao,
  excluirDespesaCartao,
  registrarPagamentoFatura,
  buscarPagamentosCartao
} from '../firebase/cartoesService'
import { buscarContasAtivas } from '../firebase/contasService'
import { formatarMoeda, formatarData } from '../utils/formatters'

function Cartoes() {
  const [cartoes, setCartoes] = useState([])
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoContas, setCarregandoContas] = useState(true)
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null)
  const [despesas, setDespesas] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [mostrarDespesas, setMostrarDespesas] = useState(false)
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1)
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())

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
    mesFatura: new Date().getMonth() + 1,
    anoFatura: new Date().getFullYear()
  })

  // Modal Pagamento Fatura
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false)
  const [formPagamento, setFormPagamento] = useState({
    cartaoId: '',
    valor: '',
    dataPagamento: new Date().toISOString().split('T')[0],
    dataVencimento: new Date().toISOString().split('T')[0],
    contaId: '',
    descricao: '',
    mesFatura: new Date().getMonth() + 1,
    anoFatura: new Date().getFullYear()
  })

  const bandeiras = [
    { nome: 'Visa', emoji: '💳' },
    { nome: 'Mastercard', emoji: '💳' },
    { nome: 'American Express', emoji: '💳' },
    { nome: 'Elo', emoji: '💳' },
    { nome: 'Hipercard', emoji: '💳' },
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

  const carregarContas = async () => {
    setCarregandoContas(true)
    const dados = await buscarContasAtivas()
    setContas(dados)
    setCarregandoContas(false)
  }

  useEffect(() => {
    carregarCartoes()
    carregarContas()
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

  const excluirCartao = async (id, nome) => {
    if (window.confirm(`Excluir o cartão "${nome}"?`)) {
      await excluirCartao(id)
      await carregarCartoes()
    }
  }

  // ==========================================
  // FUNÇÕES DE DESPESA
  // ==========================================
  const verDespesas = async (cartaoId) => {
    const cartao = cartoes.find(c => c.id === cartaoId)
    setCartaoSelecionado(cartao)
    const dados = await buscarDespesasCartao(cartaoId, filtroMes, filtroAno)
    setDespesas(dados)
    const pagamentosDados = await buscarPagamentosCartao(cartaoId)
    setPagamentos(pagamentosDados)
    setMostrarDespesas(true)
  }

  const carregarDespesasFiltradas = async () => {
    if (cartaoSelecionado) {
      const dados = await buscarDespesasCartao(cartaoSelecionado.id, filtroMes, filtroAno)
      setDespesas(dados)
    }
  }

  useEffect(() => {
    if (mostrarDespesas && cartaoSelecionado) {
      carregarDespesasFiltradas()
    }
  }, [filtroMes, filtroAno])

  const abrirModalNovaDespesa = (cartaoId) => {
    const hoje = new Date()
    setFormDespesa({
      id: null,
      cartaoId: cartaoId,
      data: hoje.toISOString().split('T')[0],
      descricao: '',
      valor: '',
      parcelado: false,
      totalParcelas: 1,
      mesFatura: hoje.getMonth() + 1,
      anoFatura: hoje.getFullYear()
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
      mesFatura: despesa.mesFatura || new Date(despesa.data).getMonth() + 1,
      anoFatura: despesa.anoFatura || new Date(despesa.data).getFullYear()
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
      totalParcelas: formDespesa.parcelado ? formDespesa.totalParcelas : 1,
      mesFatura: formDespesa.mesFatura,
      anoFatura: formDespesa.anoFatura
    }

    try {
      if (modalEdicaoDespesa) {
        await atualizarDespesaCartao(formDespesa.id, dadosParaSalvar)
      } else {
        await adicionarDespesaCartao(dadosParaSalvar)
      }
      
      if (formDespesa.cartaoId) {
        const dados = await buscarDespesasCartao(formDespesa.cartaoId, filtroMes, filtroAno)
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
      const dados = await buscarDespesasCartao(cartaoId, filtroMes, filtroAno)
      setDespesas(dados)
      await carregarCartoes()
    }
  }

  // ==========================================
  // FUNÇÕES DE PAGAMENTO DE FATURA
  // ==========================================
  const abrirModalPagamentoFatura = (cartaoId) => {
    const cartao = cartoes.find(c => c.id === cartaoId)
    if (!cartao) return

    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    const anoAtual = hoje.getFullYear()
    
    const diaVencimento = parseInt(cartao.dataVencimento) || 10
    let dataVencimento = new Date(anoAtual, mesAtual - 1, diaVencimento)
    
    if (dataVencimento < hoje) {
      dataVencimento = new Date(anoAtual, mesAtual, diaVencimento)
    }

    const diaFechamento = parseInt(cartao.dataFechamento) || 1
    let mesFatura = mesAtual
    let anoFatura = anoAtual
    
    if (hoje.getDate() > diaFechamento) {
      mesFatura = mesAtual + 1
      if (mesFatura > 12) {
        mesFatura = 1
        anoFatura = anoAtual + 1
      }
    }

    setFormPagamento({
      cartaoId: cartaoId,
      valor: '',
      dataPagamento: hoje.toISOString().split('T')[0],
      dataVencimento: dataVencimento.toISOString().split('T')[0],
      contaId: '',
      descricao: '',
      mesFatura: mesFatura,
      anoFatura: anoFatura
    })
    setModalPagamentoAberto(true)
  }

  const salvarPagamentoFatura = async (e) => {
    e.preventDefault()
    
    const valorNumero = parseFloat(formPagamento.valor)
    if (isNaN(valorNumero) || valorNumero <= 0) {
      alert('Digite um valor válido.')
      return
    }

    if (!formPagamento.contaId) {
      alert('Selecione uma conta para o pagamento.')
      return
    }

    try {
      await registrarPagamentoFatura({
        cartaoId: formPagamento.cartaoId,
        valor: valorNumero,
        data: formPagamento.dataPagamento,
        dataVencimento: formPagamento.dataVencimento,
        contaId: formPagamento.contaId,
        descricao: formPagamento.descricao || 'Pagamento de fatura',
        mesFatura: formPagamento.mesFatura,
        anoFatura: formPagamento.anoFatura
      })
      
      await carregarCartoes()
      setModalPagamentoAberto(false)
      alert('Pagamento da fatura registrado com sucesso!')
    } catch (error) {
      alert('Erro ao registrar pagamento: ' + error.message)
      console.error(error)
    }
  }

  // ==========================================
  // FORMATADORES
  // ==========================================
  const getBandeiraEmoji = (bandeira) => {
    const b = bandeiras.find(b => b.nome.toLowerCase() === bandeira?.toLowerCase())
    return b?.emoji || '💳'
  }

  const getNomeMes = (mes) => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return meses[mes - 1] || mes
  }

  const totalFatura = despesas.reduce((acc, item) => acc + item.valor, 0)

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
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
                    {cartao.statusFatura && (
                      <span style={{
                        backgroundColor: cartao.statusFatura === 'paga' ? 'rgba(45,138,78,0.2)' : 
                                       cartao.statusFatura === 'vencida' ? 'rgba(217,74,74,0.2)' : 'rgba(237,137,54,0.2)',
                        color: cartao.statusFatura === 'paga' ? '#2d8a4e' : 
                               cartao.statusFatura === 'vencida' ? '#d94a4a' : '#ed8936',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '500',
                        display: 'inline-block',
                        marginTop: '4px'
                      }}>
                        {cartao.statusFatura === 'paga' ? '✅ Fatura Paga' : 
                         cartao.statusFatura === 'vencida' ? '🔴 Fatura Vencida' : '🟡 Fatura Aberta'}
                      </span>
                    )}
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
                  gap: '6px', 
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
                      padding: '6px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
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
                      padding: '6px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ Lançar Despesa
                  </button>
                  <button
                    onClick={() => abrirModalPagamentoFatura(cartao.id)}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(159,122,234,0.2)',
                      color: '#9f7aea',
                      border: 'none',
                      padding: '6px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    💳 Pagar
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
            maxWidth: '520px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '90vh',
            overflowY: 'auto'
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
                  📅 Data da Compra
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

              {/* Selecionar Fatura */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📋 Lançar na Fatura de
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <select
                    value={formDespesa.mesFatura}
                    onChange={(e) => setFormDespesa({ ...formDespesa, mesFatura: parseInt(e.target.value) })}
                    style={{
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#ffffff'
                    }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m} style={{ backgroundColor: '#1a2b4a' }}>
                        {getNomeMes(m)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formDespesa.anoFatura}
                    onChange={(e) => setFormDespesa({ ...formDespesa, anoFatura: parseInt(e.target.value) })}
                    style={{
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#ffffff'
                    }}
                  >
                    {[2024, 2025, 2026, 2027].map(a => (
                      <option key={a} value={a} style={{ backgroundColor: '#1a2b4a' }}>{a}</option>
                    ))}
                  </select>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px' }}>
                  A despesa será exibida na fatura de {getNomeMes(formDespesa.mesFatura)}/{formDespesa.anoFatura}
                </p>
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

      {/* ==========================================
          MODAL - PAGAMENTO DE FATURA
          ========================================== */}
      {modalPagamentoAberto && (
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
        }} onClick={() => setModalPagamentoAberto(false)}>
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              💳 Pagar Fatura
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              Registre o pagamento da fatura do cartão
            </p>

            {/* Fatura Referência */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px'
            }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                  📅 Fatura Referente a
                </label>
                <select
                  value={formPagamento.mesFatura}
                  onChange={(e) => setFormPagamento({ 
                    ...formPagamento, 
                    mesFatura: parseInt(e.target.value) 
                  })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m} style={{ backgroundColor: '#1a2b4a' }}>
                      {getNomeMes(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ alignSelf: 'end' }}>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                  Ano
                </label>
                <select
                  value={formPagamento.anoFatura}
                  onChange={(e) => setFormPagamento({ 
                    ...formPagamento, 
                    anoFatura: parseInt(e.target.value) 
                  })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#ffffff'
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(a => (
                    <option key={a} value={a} style={{ backgroundColor: '#1a2b4a' }}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={salvarPagamentoFatura}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  💰 Valor Pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formPagamento.valor}
                  onChange={(e) => setFormPagamento({ ...formPagamento, valor: e.target.value })}
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
                    📅 Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={formPagamento.dataPagamento}
                    onChange={(e) => setFormPagamento({ ...formPagamento, dataPagamento: e.target.value })}
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
                    📅 Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={formPagamento.dataVencimento}
                    onChange={(e) => setFormPagamento({ ...formPagamento, dataVencimento: e.target.value })}
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
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  🏦 Conta de Pagamento
                </label>
                {carregandoContas ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
                ) : (
                  <select
                    value={formPagamento.contaId}
                    onChange={(e) => setFormPagamento({ ...formPagamento, contaId: e.target.value })}
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
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📝 Descrição (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pagamento fatura Nubank"
                  value={formPagamento.descricao}
                  onChange={(e) => setFormPagamento({ ...formPagamento, descricao: e.target.value })}
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

              {/* Informação da fatura */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>
                  Pagando fatura de <strong style={{ color: '#fff' }}>
                    {getNomeMes(formPagamento.mesFatura)}/{formPagamento.anoFatura}
                  </strong>
                </p>
                {formPagamento.dataPagamento > formPagamento.dataVencimento && (
                  <p style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px' }}>
                    ⚠️ Pagamento após o vencimento. Juros e multa serão aplicados.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalPagamentoAberto(false)}
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
                  💳 Pagar Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL - FATURA
          ========================================== */}
      {mostrarDespesas && cartaoSelecionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
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
            maxWidth: '950px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '85vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
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

            {/* Status da Fatura */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              flexWrap: 'wrap'
            }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Status</span>
                <p style={{
                  color: cartaoSelecionado.statusFatura === 'paga' ? '#2d8a4e' : 
                         cartaoSelecionado.statusFatura === 'vencida' ? '#d94a4a' : '#ed8936',
                  fontWeight: '600',
                  fontSize: '14px',
                  margin: 0
                }}>
                  {cartaoSelecionado.statusFatura === 'paga' ? '✅ Paga' : 
                   cartaoSelecionado.statusFatura === 'vencida' ? '🔴 Vencida' : '🟡 Aberta'}
                </p>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Total Pago</span>
                <p style={{ color: '#2d8a4e', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                  {formatarMoeda(cartaoSelecionado.totalPago || 0)}
                </p>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Total Fatura</span>
                <p style={{ color: '#fc8181', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                  {formatarMoeda(totalFatura)}
                </p>
              </div>
            </div>

            {/* Filtros */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Filtrar por:</span>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(parseInt(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '13px'
                }}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m} style={{ backgroundColor: '#1a2b4a' }}>
                    {getNomeMes(m)}
                  </option>
                ))}
              </select>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(parseInt(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '13px'
                }}
              >
                {[2024, 2025, 2026, 2027].map(a => (
                  <option key={a} value={a} style={{ backgroundColor: '#1a2b4a' }}>{a}</option>
                ))}
              </select>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: 'auto' }}>
                Total da Fatura: <strong style={{ color: '#fc8181' }}>{formatarMoeda(totalFatura)}</strong>
              </span>
            </div>

            {/* Tabela de Despesas */}
            {despesas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma despesa nesta fatura</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)' }}>Data</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)' }}>Descrição</th>
                      <th style={{ padding: '10px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>Valor</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Parcelas</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Fatura</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.map(despesa => (
                      <tr key={despesa.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px' }}>{formatarData(despesa.data)}</td>
                        <td style={{ padding: '10px' }}>{despesa.descricao}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#d94a4a' }}>
                          - {formatarMoeda(despesa.valor)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
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
                          <span style={{
                            backgroundColor: 'rgba(159,122,234,0.15)',
                            color: '#9f7aea',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}>
                            {getNomeMes(despesa.mesFatura || new Date(despesa.data).getMonth() + 1)}/{despesa.anoFatura || new Date(despesa.data).getFullYear()}
                          </span>
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