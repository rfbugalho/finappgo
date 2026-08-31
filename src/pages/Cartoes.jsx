import React, { useState, useEffect } from 'react'
import { 
  buscarCartoes, 
  adicionarCartao, 
  atualizarCartao, 
  excluirCartao,
  buscarDespesasCartao,
  buscarDespesasConsolidadas,
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
  
  // ⭐ NOVO: Grid Consolidado
  const [despesasConsolidadas, setDespesasConsolidadas] = useState([])
  const [dadosConsolidados, setDadosConsolidados] = useState([])
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear())
  const [cartaoSelecionadoDetalhe, setCartaoSelecionadoDetalhe] = useState(null)
  const [mostrarDetalheFatura, setMostrarDetalheFatura] = useState(false)
  const [mesDetalhe, setMesDetalhe] = useState(new Date().getMonth() + 1)
  const [anoDetalhe, setAnoDetalhe] = useState(new Date().getFullYear())

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

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

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

  const carregarDadosConsolidados = async () => {
    const despesas = await buscarDespesasConsolidadas(anoSelecionado)
    setDespesasConsolidadas(despesas)
    
    // Agrupar por cartão e mês
    const consolidado = {}
    cartoes.forEach(cartao => {
      consolidado[cartao.id] = {
        nome: cartao.nome,
        bandeira: cartao.bandeira,
        limiteTotal: cartao.limiteTotal || 0,
        meses: {}
      }
      for (let i = 0; i < 12; i++) {
        consolidado[cartao.id].meses[i + 1] = 0
      }
    })
    
    despesas.forEach(despesa => {
      const data = new Date(despesa.data)
      const mes = data.getMonth() + 1
      const cartaoId = despesa.cartaoId
      if (consolidado[cartaoId]) {
        consolidado[cartaoId].meses[mes] = (consolidado[cartaoId].meses[mes] || 0) + despesa.valor
      }
    })
    
    // Calcular total por cartão e porcentagem
    const resultado = Object.keys(consolidado).map(key => {
      const item = consolidado[key]
      const total = Object.values(item.meses).reduce((acc, val) => acc + val, 0)
      const totalGeral = Object.values(consolidado).reduce((acc, c) => {
        return acc + Object.values(c.meses).reduce((s, v) => s + v, 0)
      }, 0)
      const percentual = totalGeral > 0 ? (total / totalGeral) * 100 : 0
      return {
        id: key,
        ...item,
        total,
        percentual
      }
    })
    
    setDadosConsolidados(resultado)
  }

  useEffect(() => {
    carregarCartoes()
    carregarContas()
  }, [])

  useEffect(() => {
    if (cartoes.length > 0) {
      carregarDadosConsolidados()
    }
  }, [cartoes, anoSelecionado])

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
  // FUNÇÕES DE PAGAMENTO
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
  // FUNÇÕES DE DETALHE DA FATURA
  // ==========================================
  const abrirDetalheFatura = async (cartaoId) => {
    const cartao = cartoes.find(c => c.id === cartaoId)
    setCartaoSelecionadoDetalhe(cartao)
    const dados = await buscarDespesasCartao(cartaoId, mesDetalhe, anoDetalhe)
    setDespesas(dados)
    setMostrarDetalheFatura(true)
  }

  const carregarDetalheFatura = async () => {
    if (cartaoSelecionadoDetalhe) {
      const dados = await buscarDespesasCartao(cartaoSelecionadoDetalhe.id, mesDetalhe, anoDetalhe)
      setDespesas(dados)
    }
  }

  useEffect(() => {
    if (mostrarDetalheFatura && cartaoSelecionadoDetalhe) {
      carregarDetalheFatura()
    }
  }, [mesDetalhe, anoDetalhe])

  // ==========================================
  // FORMATADORES
  // ==========================================
  const getBandeiraEmoji = (bandeira) => {
    const b = bandeiras.find(b => b.nome.toLowerCase() === bandeira?.toLowerCase())
    return b?.emoji || '💳'
  }

  const getNomeMes = (mes) => {
    return meses[mes - 1] || mes
  }

  const totalFatura = despesas.reduce((acc, item) => acc + item.valor, 0)

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
            💳 Cartões de Crédito
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${cartoes.length} cartão(ões) cadastrado(s)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Ano:</label>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
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
      </div>

      {/* ==========================================
          GRID CONSOLIDADO
          ========================================== */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '14px', 
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '600',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          📊 Resumo Consolidado - {anoSelecionado}
        </h3>
        
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
            Carregando dados...
          </p>
        ) : dadosConsolidados.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
            Nenhum dado disponível para {anoSelecionado}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              color: '#fff', 
              fontSize: '13px',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.4)' }}>
                    Cartão / Limite
                  </th>
                  {meses.map((mes, idx) => (
                    <th key={idx} style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right', 
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setMesDetalhe(idx + 1)
                      setAnoDetalhe(anoSelecionado)
                    }}
                    >
                      {mes.substring(0, 3)}
                    </th>
                  ))}
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>
                    Total
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    % Rec
                  </th>
                </tr>
              </thead>
              <tbody>
                {dadosConsolidados.map((item) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => abrirDetalheFatura(item.id)}
                  >
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getBandeiraEmoji(item.bandeira)}</span>
                        <span>{item.nome}</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
                          {formatarMoeda(item.limiteTotal)}
                        </span>
                      </div>
                    </td>
                    {Object.values(item.meses).map((valor, idx) => (
                      <td key={idx} style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right',
                        color: valor > 0 ? '#fff' : 'rgba(255,255,255,0.15)',
                        fontSize: '12px'
                      }}>
                        {valor > 0 ? formatarMoeda(valor) : '-'}
                      </td>
                    ))}
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: '#fff' }}>
                      {formatarMoeda(item.total)}
                    </td>
                    <td style={{ 
                      padding: '8px 12px', 
                      textAlign: 'center',
                      color: item.percentual > 10 ? '#fc8181' : '#63b3ed',
                      fontWeight: '500',
                      fontSize: '12px'
                    }}>
                      {item.percentual > 0 ? item.percentual.toFixed(2) + '%' : '-'}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#fff' }}>
                    Total Geral
                  </td>
                  {Array.from({ length: 12 }, (_, idx) => {
                    const totalMes = dadosConsolidados.reduce((acc, item) => acc + (item.meses[idx + 1] || 0), 0)
                    return (
                      <td key={idx} style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        fontWeight: '600',
                        color: totalMes > 0 ? '#fff' : 'rgba(255,255,255,0.15)'
                      }}>
                        {totalMes > 0 ? formatarMoeda(totalMes) : '-'}
                      </td>
                    )
                  })}
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: '#fff' }}>
                    {formatarMoeda(dadosConsolidados.reduce((acc, item) => acc + item.total, 0))}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    -
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>
              💡 Clique em qualquer cartão para ver o detalhamento mensal
            </p>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL - DETALHE DA FATURA
          ========================================== */}
      {mostrarDetalheFatura && cartaoSelecionadoDetalhe && (
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
        }} onClick={() => setMostrarDetalheFatura(false)}>
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '1100px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '85vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '20px', color: '#ffffff', margin: 0 }}>
                  📋 Fatura - {cartaoSelecionadoDetalhe.nome}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  {getNomeMes(mesDetalhe)}/{anoDetalhe} · {despesas.length} despesa(s)
                </p>
              </div>
              <button
                onClick={() => setMostrarDetalheFatura(false)}
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
                value={mesDetalhe}
                onChange={(e) => setMesDetalhe(parseInt(e.target.value))}
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
                value={anoDetalhe}
                onChange={(e) => setAnoDetalhe(parseInt(e.target.value))}
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
              <button
                onClick={() => abrirModalNovaDespesa(cartaoSelecionadoDetalhe.id)}
                style={{
                  backgroundColor: 'rgba(45,138,78,0.2)',
                  color: '#2d8a4e',
                  border: '1px solid rgba(45,138,78,0.2)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                ➕ Lançar Despesa
              </button>
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
                      <th style={{ padding: '10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)' }}>Categoria</th>
                      <th style={{ padding: '10px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>Valor Total</th>
                      <th style={{ padding: '10px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>Valor Parcela</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Parcelas</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Situação</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.map(despesa => (
                      <tr key={despesa.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px' }}>{formatarData(despesa.data)}</td>
                        <td style={{ padding: '10px' }}>{despesa.descricao}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.6)'
                          }}>
                            {despesa.categoria || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#fc8181' }}>
                          {formatarMoeda(despesa.valor)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          {despesa.parcelado ? formatarMoeda(despesa.valorParcela) : '-'}
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
                            backgroundColor: despesa.status === 'pago' ? 'rgba(45,138,78,0.2)' : 'rgba(237,137,54,0.2)',
                            color: despesa.status === 'pago' ? '#2d8a4e' : '#ed8936',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}>
                            {despesa.status === 'pago' ? '✅ Pago' : '⏳ Pendente'}
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