import React, { useState, useEffect } from 'react'
import { 
  buscarLancamentos, 
  adicionarLancamento, 
  atualizarLancamento, 
  excluirLancamento,
  atualizarStatusPagamento
} from '../firebase/lancamentosService'
import { buscarCategorias } from '../firebase/categoriasService'
import { buscarContasAtivas } from '../firebase/contasService'
import { formatarMoeda, formatarData } from '../utils/formatters'

function Lancamentos() {
  // ==========================================
  // ESTADOS PRINCIPAIS
  // ==========================================
  const [lancamentos, setLancamentos] = useState([])
  const [lancamentosFiltrados, setLancamentosFiltrados] = useState([])
  const [categorias, setCategorias] = useState([])
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoCategorias, setCarregandoCategorias] = useState(true)
  const [carregandoContas, setCarregandoContas] = useState(true)

  // ==========================================
  // ESTADOS DOS FILTROS
  // ==========================================
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    tipo: 'todos',
    categoria: '',
    conta: '',
    busca: '',
    ordenarPor: 'data',
    ordem: 'desc',
    status: 'todos'
  })

  // ==========================================
  // ESTADOS DOS TOTALIZADORES
  // ==========================================
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [saldoFiltrado, setSaldoFiltrado] = useState(0)

  // ==========================================
  // ESTADOS DO MODAL
  // ==========================================
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEdicao, setModalEdicao] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    data: '',
    descricao: '',
    categoria: '',
    subcategoria: '',
    tipo: 'despesa',
    valor: '',
    contaId: '',
    statusPagamento: 'pendente'
  })

  const statusPagamento = [
    { valor: 'pendente', label: '⏳ Pendente', cor: '#ed8936' },
    { valor: 'pago', label: '✅ Pago', cor: '#2d8a4e' },
    { valor: 'vencido', label: '🔴 Vencido', cor: '#d94a4a' }
  ]

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarLancamentos = async () => {
    setCarregando(true)
    const dados = await buscarLancamentos()
    setLancamentos(dados)
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

  // ==========================================
  // APLICAR FILTROS
  // ==========================================
  const aplicarFiltros = () => {
    let dados = [...lancamentos]

    const mesStr = String(filtros.mes).padStart(2, '0')
    const anoStr = String(filtros.ano)
    dados = dados.filter(item => {
      if (!item.data) return false
      const partes = item.data.split('-')
      return partes[0] === anoStr && partes[1] === mesStr
    })

    if (filtros.tipo !== 'todos') {
      dados = dados.filter(item => item.tipo === filtros.tipo)
    }

    if (filtros.categoria) {
      dados = dados.filter(item => item.categoria === filtros.categoria)
    }

    if (filtros.conta) {
      dados = dados.filter(item => item.contaId === filtros.conta)
    }

    if (filtros.status !== 'todos') {
      dados = dados.filter(item => item.statusPagamento === filtros.status)
    }

    if (filtros.busca.trim()) {
      const buscaLower = filtros.busca.trim().toLowerCase()
      dados = dados.filter(item => 
        item.descricao.toLowerCase().includes(buscaLower)
      )
    }

    // Ordenação
    dados.sort((a, b) => {
      let valA = a[filtros.ordenarPor]
      let valB = b[filtros.ordenarPor]
      
      if (filtros.ordenarPor === 'valor') {
        valA = parseFloat(valA) || 0
        valB = parseFloat(valB) || 0
      }
      
      if (filtros.ordenarPor === 'data') {
        valA = new Date(valA)
        valB = new Date(valB)
      }
      
      if (filtros.ordenarPor === 'descricao') {
        valA = (valA || '').toLowerCase()
        valB = (valB || '').toLowerCase()
      }
      
      if (valA < valB) return filtros.ordem === 'asc' ? -1 : 1
      if (valA > valB) return filtros.ordem === 'asc' ? 1 : -1
      return 0
    })

    setLancamentosFiltrados(dados)

    const receitas = dados
      .filter(item => item.tipo === 'receita')
      .reduce((acc, item) => acc + item.valor, 0)
    
    const despesas = dados
      .filter(item => item.tipo === 'despesa')
      .reduce((acc, item) => acc + item.valor, 0)
    
    setTotalReceitas(receitas)
    setTotalDespesas(despesas)
    setSaldoFiltrado(receitas - despesas)
  }

  useEffect(() => {
    carregarLancamentos()
    carregarCategorias()
    carregarContas()
  }, [])

  useEffect(() => {
    if (!carregando) {
      aplicarFiltros()
    }
  }, [lancamentos, filtros, carregando])

  // ==========================================
  // FUNÇÕES DOS FILTROS
  // ==========================================
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  const limparFiltros = () => {
    setFiltros({
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      tipo: 'todos',
      categoria: '',
      conta: '',
      busca: '',
      ordenarPor: 'data',
      ordem: 'desc',
      status: 'todos'
    })
  }

  // ==========================================
  // FUNÇÕES DO CRUD
  // ==========================================
  const abrirModalNovo = () => {
    setFormData({
      id: null,
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      categoria: '',
      subcategoria: '',
      tipo: 'despesa',
      valor: '',
      contaId: '',
      statusPagamento: 'pendente'
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
      subcategoria: lancamento.subcategoria || '',
      tipo: lancamento.tipo,
      valor: lancamento.valor,
      contaId: lancamento.contaId || '',
      statusPagamento: lancamento.statusPagamento || 'pendente'
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
      subcategoria: '',
      tipo: 'despesa',
      valor: '',
      contaId: '',
      statusPagamento: 'pendente'
    })
  }

  const salvarLancamento = async (e) => {
    e.preventDefault()
    
    const valorNumero = parseFloat(formData.valor)
    if (isNaN(valorNumero) || valorNumero <= 0) {
      alert('Por favor, insira um valor válido maior que zero.')
      return
    }

    if (!formData.categoria) {
      alert('Por favor, selecione uma categoria.')
      return
    }

    if (!formData.contaId) {
      alert('Por favor, selecione uma conta.')
      return
    }

    const dadosParaSalvar = {
      data: formData.data,
      descricao: formData.descricao,
      categoria: formData.categoria,
      subcategoria: formData.subcategoria || '',
      tipo: formData.tipo,
      valor: valorNumero,
      contaId: formData.contaId,
      statusPagamento: formData.statusPagamento || 'pendente'
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

  const handleStatusChange = async (id, novoStatus) => {
    try {
      await atualizarStatusPagamento(id, novoStatus)
      await carregarLancamentos()
    } catch (error) {
      alert('Erro ao atualizar status.')
      console.error(error)
    }
  }

  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================
  const getNomeConta = (contaId) => {
    const conta = contas.find(c => c.id === contaId)
    return conta ? conta.nomeExibicao || conta.instituicao : 'Conta não encontrada'
  }

  const getLogoConta = (contaId) => {
    const conta = contas.find(c => c.id === contaId)
    return conta ? conta.logo || '🏦' : '🏦'
  }

  const getStatusLabel = (status) => {
    const s = statusPagamento.find(s => s.valor === status)
    return s ? s.label : '⏳ Pendente'
  }

  const getStatusCor = (status) => {
    const s = statusPagamento.find(s => s.valor === status)
    return s ? s.cor : '#ed8936'
  }

  const categoriasFiltradas = categorias.filter(cat => cat.tipo === formData.tipo)
  const categoriaSelecionada = categorias.find(cat => cat.nome === formData.categoria)
  const subcategoriasDisponiveis = categoriaSelecionada?.subcategorias || []

  const opcoesOrdenacao = [
    { valor: 'data', label: '📅 Data' },
    { valor: 'descricao', label: '📝 Descrição' },
    { valor: 'valor', label: '💰 Valor' }
  ]

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
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '4px' }}>
            📋 Lançamentos
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${lancamentosFiltrados.length} lançamento(s) filtrados`}
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

      {/* TOTALIZADORES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(45,138,78,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(45,138,78,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Receitas</p>
          <p style={{ color: '#2d8a4e', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: 0 }}>
            {formatarMoeda(totalReceitas)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(217,74,74,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(217,74,74,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Despesas</p>
          <p style={{ color: '#d94a4a', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: 0 }}>
            {formatarMoeda(totalDespesas)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(58,122,189,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(58,122,189,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Saldo</p>
          <p style={{ 
            color: saldoFiltrado >= 0 ? '#2d8a4e' : '#d94a4a', 
            fontSize: 'clamp(16px, 3vw, 20px)', 
            fontWeight: '700', 
            margin: 0 
          }}>
            {formatarMoeda(saldoFiltrado)}
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(159,122,234,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(159,122,234,0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Total</p>
          <p style={{ color: '#9f7aea', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: '700', margin: 0 }}>
            {lancamentosFiltrados.length} itens
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '15px 20px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          alignItems: 'end'
        }}>
          {/* Mês */}
          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              📅 Mês
            </label>
            <select
              value={filtros.mes}
              onChange={(e) => handleFiltroChange('mes', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m} style={{ backgroundColor: '#1a2b4a' }}>
                  {new Date(2024, m-1).toLocaleString('pt-BR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* Ano */}
          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              📅 Ano
            </label>
            <select
              value={filtros.ano}
              onChange={(e) => handleFiltroChange('ano', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              {[2024, 2025, 2026, 2027, 2028].map(a => (
                <option key={a} value={a} style={{ backgroundColor: '#1a2b4a' }}>{a}</option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              📊 Tipo
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="todos" style={{ backgroundColor: '#1a2b4a' }}>Todos</option>
              <option value="receita" style={{ backgroundColor: '#1a2b4a' }}>📈 Receitas</option>
              <option value="despesa" style={{ backgroundColor: '#1a2b4a' }}>📉 Despesas</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              📌 Status
            </label>
            <select
              value={filtros.status}
              onChange={(e) => handleFiltroChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="todos" style={{ backgroundColor: '#1a2b4a' }}>Todos</option>
              {statusPagamento.map(s => (
                <option key={s.valor} value={s.valor} style={{ backgroundColor: '#1a2b4a' }}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              🏷️ Categoria
            </label>
            <select
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="" style={{ backgroundColor: '#1a2b4a' }}>Todas</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.nome} style={{ backgroundColor: '#1a2b4a' }}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Conta */}
          <div>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              🏦 Conta
            </label>
            <select
              value={filtros.conta}
              onChange={(e) => handleFiltroChange('conta', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="" style={{ backgroundColor: '#1a2b4a' }}>Todas</option>
              {contas.map(conta => (
                <option key={conta.id} value={conta.id} style={{ backgroundColor: '#1a2b4a' }}>
                  {conta.nomeExibicao || conta.instituicao}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segunda linha: Busca + Ordenação + Limpar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '12px',
          alignItems: 'end'
        }}>
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              🔍 Buscar por descrição
            </label>
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={filtros.busca}
              onChange={(e) => handleFiltroChange('busca', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              Ordenar por
            </label>
            <select
              value={filtros.ordenarPor}
              onChange={(e) => handleFiltroChange('ordenarPor', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              {opcoesOrdenacao.map(op => (
                <option key={op.valor} value={op.valor} style={{ backgroundColor: '#1a2b4a' }}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
              Ordem
            </label>
            <select
              value={filtros.ordem}
              onChange={(e) => handleFiltroChange('ordem', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="desc" style={{ backgroundColor: '#1a2b4a' }}>⬇️ Decrescente</option>
              <option value="asc" style={{ backgroundColor: '#1a2b4a' }}>⬆️ Crescente</option>
            </select>
          </div>

          <div style={{ flex: 0, minWidth: '100px' }}>
            <button
              onClick={limparFiltros}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: 'rgba(217,74,74,0.2)',
                color: '#d94a4a',
                border: '1px solid rgba(217,74,74,0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(217,74,74,0.4)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(217,74,74,0.2)'}
            >
              🗑️ Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* TABELA DE LANÇAMENTOS */}
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
        ) : lancamentosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontSize: '18px' }}>Nenhum lançamento encontrado</p>
            <p style={{ fontSize: '14px' }}>
              {filtros.busca || filtros.categoria || filtros.conta || filtros.tipo !== 'todos' || filtros.status !== 'todos'
                ? 'Tente ajustar os filtros de busca' 
                : 'Clique em "Novo Lançamento" para começar'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Data</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Descrição</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Categoria</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Conta</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Tipo</th>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Valor</th>
                <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentosFiltrados.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{formatarData(item.data)}</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{item.descricao}</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      {item.categoria}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{getLogoConta(item.contaId)}</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                        {getNomeConta(item.contaId)}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>
                    <span style={{
                      backgroundColor: item.tipo === 'receita' ? 'rgba(45,138,78,0.2)' : 'rgba(217,74,74,0.2)',
                      color: item.tipo === 'receita' ? '#2d8a4e' : '#d94a4a',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {item.tipo === 'receita' ? '📈 Receita' : '📉 Despesa'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>
                    <select
                      value={item.statusPagamento || 'pendente'}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      style={{
                        backgroundColor: 'transparent',
                        color: getStatusCor(item.statusPagamento || 'pendente'),
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {statusPagamento.map(s => (
                        <option key={s.valor} value={s.valor} style={{ backgroundColor: '#1a2b4a', color: s.cor }}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    fontSize: '13px', 
                    textAlign: 'right',
                    fontWeight: '600',
                    color: item.tipo === 'receita' ? '#2d8a4e' : '#d94a4a'
                  }}>
                    {item.tipo === 'receita' ? '+' : '-'} {formatarMoeda(item.valor)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={() => abrirModalEditar(item)}
                      style={{
                        backgroundColor: 'rgba(58,122,189,0.2)',
                        color: '#3a7abd',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '6px'
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
        )}
      </div>

      {/* MODAL - Formulário de Lançamento */}
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
            maxWidth: '520px',
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
              {/* Data */}
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

              {/* Descrição */}
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

              {/* Tipo */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  📊 Tipo
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, tipo: 'receita', categoria: '', subcategoria: '' })
                    }}
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
                    onClick={() => {
                      setFormData({ ...formData, tipo: 'despesa', categoria: '', subcategoria: '' })
                    }}
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

              {/* Conta */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  🏦 Conta
                </label>
                {carregandoContas ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Carregando contas...</p>
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
                      outline: 'none',
                      boxSizing: 'border-box',
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
                {contas.length === 0 && !carregandoContas && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px' }}>
                    Nenhuma conta ativa cadastrada.
                    <br />
                    <a href="/contas" style={{ color: '#3a7abd' }}>Clique aqui para criar uma conta</a>
                  </p>
                )}
              </div>

              {/* Categoria */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  🏷️ Categoria
                </label>
                {carregandoCategorias ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Carregando categorias...</p>
                ) : (
                  <select
                    value={formData.categoria}
                    onChange={(e) => {
                      const categoriaNome = e.target.value
                      setFormData({ 
                        ...formData, 
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
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#ffffff'
                    }}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categoriasFiltradas.map(cat => (
                      <option key={cat.id} value={cat.nome} style={{ backgroundColor: '#1a2b4a' }}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                )}
                {categoriasFiltradas.length === 0 && !carregandoCategorias && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px' }}>
                    Nenhuma categoria cadastrada para {formData.tipo === 'receita' ? 'receitas' : 'despesas'}.
                    <br />
                    <a href="/categorias" style={{ color: '#3a7abd' }}>Clique aqui para criar uma categoria</a>
                  </p>
                )}
              </div>

              {/* Subcategoria */}
              {formData.categoria && subcategoriasDisponiveis.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
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
                      outline: 'none',
                      boxSizing: 'border-box',
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
                </div>
              )}

              {/* Status de Pagamento */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                  📌 Status de Pagamento
                </label>
                <select
                  value={formData.statusPagamento}
                  onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value })}
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
                >
                  {statusPagamento.map(s => (
                    <option key={s.valor} value={s.valor} style={{ backgroundColor: '#1a2b4a', color: s.cor }}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor */}
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

              {/* Botões */}
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