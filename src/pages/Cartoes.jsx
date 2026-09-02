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
import { buscarCategorias } from '../firebase/categoriasService'
import { formatarMoeda, formatarData } from '../utils/formatters'

function Cartoes() {
  const [cartoes, setCartoes] = useState([])
  const [contas, setContas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoContas, setCarregandoContas] = useState(true)
  const [carregandoCategorias, setCarregandoCategorias] = useState(true)
  
  // ==========================================
  // ESTADOS PARA FATURA DETALHADA
  // ==========================================
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null)
  const [despesas, setDespesas] = useState([])
  const [mostrarFatura, setMostrarFatura] = useState(false)
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1)
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())
  
  // ==========================================
  // ESTADOS PARA GRID CONSOLIDADO
  // ==========================================
  const [dadosConsolidados, setDadosConsolidados] = useState([])
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear())

  // ==========================================
  // MODAL CARTÃO
  // ==========================================
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

  // ==========================================
  // MODAL DESPESA (COM CATEGORIA E SUBCATEGORIA)
  // ==========================================
  const [modalDespesaAberto, setModalDespesaAberto] = useState(false)
  const [modalEdicaoDespesa, setModalEdicaoDespesa] = useState(false)
  const [formDespesa, setFormDespesa] = useState({
    id: null,
    cartaoId: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    observacao: '',
    categoria: '',
    subcategoria: '',
    valor: '',
    parcelado: false,
    totalParcelas: 1,
    mesFatura: new Date().getMonth() + 1,
    anoFatura: new Date().getFullYear()
  })

  // ==========================================
  // MODAL PAGAMENTO
  // ==========================================
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

  const carregarCategorias = async () => {
    setCarregandoCategorias(true)
    const dados = await buscarCategorias()
    setCategorias(dados)
    setCarregandoCategorias(false)
  }

  const carregarDadosConsolidados = async () => {
    const despesas = await buscarDespesasConsolidadas(anoSelecionado)
    
    const consolidado = {}
    cartoes.forEach(cartao => {
      consolidado[cartao.id] = {
        id: cartao.id,
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
    
    const resultado = Object.keys(consolidado).map(key => {
      const item = consolidado[key]
      const total = Object.values(item.meses).reduce((acc, val) => acc + val, 0)
      const totalGeral = Object.values(consolidado).reduce((acc, c) => {
        return acc + Object.values(c.meses).reduce((s, v) => s + v, 0)
      }, 0)
      const percentual = totalGeral > 0 ? (total / totalGeral) * 100 : 0
      return {
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
    carregarCategorias()
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
  // FUNÇÕES DE FATURA
  // ==========================================
  const verFatura = async (cartaoId) => {
    const cartao = cartoes.find(c => c.id === cartaoId)
    if (!cartao) return
    setCartaoSelecionado(cartao)
    const dados = await buscarDespesasCartao(cartaoId, filtroMes, filtroAno)
    setDespesas(dados)
    setMostrarFatura(true)
  }

  const carregarFatura = async () => {
    if (cartaoSelecionado) {
      const dados = await buscarDespesasCartao(cartaoSelecionado.id, filtroMes, filtroAno)
      setDespesas(dados)
    }
  }

  useEffect(() => {
    if (mostrarFatura && cartaoSelecionado) {
      carregarFatura()
    }
  }, [filtroMes, filtroAno])

  // ==========================================
  // FUNÇÕES DE DESPESA (COM CATEGORIA E SUBCATEGORIA)
  // ==========================================
  const abrirModalNovaDespesa = (cartaoId) => {
    const hoje = new Date()
    setFormDespesa({
      id: null,
      cartaoId: cartaoId,
      data: hoje.toISOString().split('T')[0],
      descricao: '',
      observacao: '',
      categoria: '',
      subcategoria: '',
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
      observacao: despesa.observacao || '',
      categoria: despesa.categoria || '',
      subcategoria: despesa.subcategoria || '',
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

    if (!formDespesa.categoria) {
      alert('Selecione uma categoria.')
      return
    }

    const dadosParaSalvar = {
      cartaoId: formDespesa.cartaoId,
      data: formDespesa.data,
      descricao: formDespesa.descricao.trim(),
      observacao: formDespesa.observacao || '',
      categoria: formDespesa.categoria,
      subcategoria: formDespesa.subcategoria || '',
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

  // Filtrar categorias para despesas
  const categoriasDespesa = categorias.filter(cat => cat.tipo === 'despesa')
  
  // Subcategorias da categoria selecionada
  const categoriaSelecionada = categorias.find(cat => cat.nome === formDespesa.categoria)
  const subcategoriasDisponiveis = categoriaSelecionada?.subcategorias || []

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
                      fontSize: '11px'
                    }}>
                      {mes.substring(0, 3)}
                    </th>
                  ))}
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>
                    Total
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    % Rec
                  </th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {dadosConsolidados.map((item) => (
                  <tr key={item.id} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => verFatura(item.id)}
                          style={{
                            backgroundColor: 'rgba(58,122,189,0.2)',
                            color: '#3a7abd',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          📋 Fatura
                        </button>
                        <button
                          onClick={() => abrirModalNovaDespesa(item.id)}
                          style={{
                            backgroundColor: 'rgba(45,138,78,0.2)',
                            color: '#2d8a4e',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ➕
                        </button>
                        <button
                          onClick={() => abrirModalEditarCartao(cartoes.find(c => c.id === item.id))}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.6)',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✏️
                        </button>
                      </div>
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
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>-</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>-</td>
                </tr>
              </tbody>
            </table>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>
              💡 Clique em "Fatura" para ver o detalhamento mensal
            </p>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL - FATURA DETALHADA
          ========================================== */}
      {mostrarFatura && cartaoSelecionado && (
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
        }} onClick={() => setMostrarFatura(false)}>
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
                  📋 Fatura - {cartaoSelecionado.nome}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  {getNomeMes(filtroMes)}/{filtroAno} · {despesas.length} despesa(s)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => abrirModalPagamentoFatura(cartaoSelecionado.id)}
                  style={{
                    backgroundColor: 'rgba(159,122,234,0.2)',
                    color: '#9f7aea',
                    border: '1px solid rgba(159,122,234,0.2)',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  💳 Pagar
                </button>
                <button
                  onClick={() => setMostrarFatura(false)}
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
                      <th style={{ padding: '10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)' }}>Categoria</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)' }}>Subcategoria</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)' }}>Observação</th>
                      <th style={{ padding: '10px', textAlign: 'right', color: 'rgba(255,255,255,0.4)' }}>Valor</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Parcelas</th>
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
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.3)'
                          }}>
                            {despesa.subcategoria || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                          {despesa.observacao || '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#fc8181' }}>
                          {formatarMoeda(despesa.valor)}
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

      {/* ==========================================
          MODAL - CARTÃO (NOVO/EDITAR)
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
          MODAL - DESPESA (COM CATEGORIA E SUBCATEGORIA)
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

              {/* ⭐ CATEGORIA */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  🏷️ Categoria
                </label>
                {carregandoCategorias ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
                ) : (
                  <select
                    value={formDespesa.categoria}
                    onChange={(e) => {
                      const categoriaNome = e.target.value
                      setFormDespesa({ 
                        ...formDespesa, 
                        categoria: categoriaNome,
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
                    {categoriasDespesa.map(cat => (
                      <option key={cat.id} value={cat.nome} style={{ backgroundColor: '#1a2b4a' }}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                )}
                {categoriasDespesa.length === 0 && !carregandoCategorias && (
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px' }}>
                    Nenhuma categoria de despesa cadastrada.
                    <br />
                    <a href="/categorias" style={{ color: '#3a7abd' }}>Clique aqui para criar uma categoria</a>
                  </p>
                )}
              </div>

              {/* ⭐ SUBCATEGORIA */}
              {formDespesa.categoria && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    🔹 Subcategoria
                  </label>
                  {subcategoriasDisponiveis.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontStyle: 'italic' }}>
                      Nenhuma subcategoria cadastrada para esta categoria
                    </p>
                  ) : (
                    <select
                      value={formDespesa.subcategoria}
                      onChange={(e) => setFormDespesa({ ...formDespesa, subcategoria: e.target.value })}
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
                      {subcategoriasDisponiveis.map((sub, idx) => (
                        <option key={idx} value={sub} style={{ backgroundColor: '#1a2b4a' }}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📝 Observação (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Compra do mês, Presente para João..."
                  value={formDespesa.observacao}
                  onChange={(e) => setFormDespesa({ ...formDespesa, observacao: e.target.value })}
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
    </div>
  )
}

export default Cartoes