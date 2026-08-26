import React, { useState, useEffect } from 'react'
import { 
  buscarContas, 
  adicionarConta, 
  atualizarConta, 
  excluirConta,
  transferirEntreContas
} from '../firebase/contasService'
import { formatarMoeda } from '../utils/formatters'

const BANCOS = [
  { nome: 'Nubank', emoji: '🟣' },
  { nome: 'Itaú', emoji: '🟠' },
  { nome: 'Bradesco', emoji: '🔴' },
  { nome: 'Santander', emoji: '🔵' },
  { nome: 'Caixa', emoji: '🟡' },
  { nome: 'Banco do Brasil', emoji: '🟢' },
  { nome: 'Inter', emoji: '🟧' },
  { nome: 'C6 Bank', emoji: '⬛' },
  { nome: 'PicPay', emoji: '🟩' },
  { nome: 'Mercado Pago', emoji: '🟦' },
  { nome: 'Outro', emoji: '🏦' }
]

function Contas() {
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)

  // Modal Conta
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEdicao, setModalEdicao] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    instituicao: '',
    tipo: 'corrente',
    logo: '🏦',
    saldoInicial: '',
    dataAbertura: new Date().toISOString().split('T')[0]
  })

  // Modal Transferência
  const [modalTransferenciaAberto, setModalTransferenciaAberto] = useState(false)
  const [transferencia, setTransferencia] = useState({
    contaOrigemId: '',
    contaDestinoId: '',
    valor: '',
    descricao: ''
  })
  const [erroTransferencia, setErroTransferencia] = useState('')
  const [carregandoTransferencia, setCarregandoTransferencia] = useState(false)

  const carregarContas = async () => {
    setCarregando(true)
    const dados = await buscarContas()
    setContas(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarContas()
  }, [])

  // ==========================================
  // FUNÇÕES DA CONTA
  // ==========================================
  const abrirModalNovo = () => {
    setFormData({
      id: null,
      instituicao: '',
      tipo: 'corrente',
      logo: '🏦',
      saldoInicial: '',
      dataAbertura: new Date().toISOString().split('T')[0]
    })
    setModalEdicao(false)
    setModalAberto(true)
  }

  const abrirModalEditar = (conta) => {
    setFormData({
      id: conta.id,
      instituicao: conta.instituicao,
      tipo: conta.tipo,
      logo: conta.logo || '🏦',
      saldoInicial: conta.saldoInicial,
      dataAbertura: conta.dataAbertura
    })
    setModalEdicao(true)
    setModalAberto(true)
  }

  const salvarConta = async (e) => {
    e.preventDefault()
    
    if (!formData.instituicao.trim()) {
      alert('Digite o nome da instituição.')
      return
    }

    const dadosParaSalvar = {
      instituicao: formData.instituicao.trim(),
      tipo: formData.tipo,
      logo: formData.logo,
      saldoInicial: parseFloat(formData.saldoInicial) || 0,
      dataAbertura: formData.dataAbertura,
      status: 'ativo'
    }

    try {
      if (modalEdicao) {
        await atualizarConta(formData.id, dadosParaSalvar)
      } else {
        await adicionarConta(dadosParaSalvar)
      }
      
      await carregarContas()
      setModalAberto(false)
    } catch (error) {
      alert('Erro ao salvar conta.')
      console.error(error)
    }
  }

  const excluirConta = async (id, nome) => {
    if (window.confirm(`Excluir a conta "${nome}"?`)) {
      await excluirConta(id)
      await carregarContas()
    }
  }

  const inativarConta = async (id, statusAtual) => {
    const novoStatus = statusAtual === 'ativo' ? 'inativo' : 'ativo'
    const confirmar = window.confirm(
      `${novoStatus === 'ativo' ? 'Ativar' : 'Inativar'} esta conta?`
    )
    if (confirmar) {
      const conta = contas.find(c => c.id === id)
      await atualizarConta(id, { ...conta, status: novoStatus })
      await carregarContas()
    }
  }

  // ==========================================
  // FUNÇÕES DE TRANSFERÊNCIA
  // ==========================================
  const abrirModalTransferencia = () => {
    setTransferencia({
      contaOrigemId: '',
      contaDestinoId: '',
      valor: '',
      descricao: ''
    })
    setErroTransferencia('')
    setModalTransferenciaAberto(true)
  }

  const realizarTransferencia = async (e) => {
    e.preventDefault()
    setErroTransferencia('')
    setCarregandoTransferencia(true)

    const valorNumero = parseFloat(transferencia.valor)
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setErroTransferencia('Digite um valor válido.')
      setCarregandoTransferencia(false)
      return
    }

    if (!transferencia.contaOrigemId || !transferencia.contaDestinoId) {
      setErroTransferencia('Selecione as contas de origem e destino.')
      setCarregandoTransferencia(false)
      return
    }

    if (transferencia.contaOrigemId === transferencia.contaDestinoId) {
      setErroTransferencia('Não é possível transferir para a mesma conta.')
      setCarregandoTransferencia(false)
      return
    }

    try {
      await transferirEntreContas(
        transferencia.contaOrigemId,
        transferencia.contaDestinoId,
        valorNumero,
        transferencia.descricao
      )
      
      await carregarContas()
      setModalTransferenciaAberto(false)
      alert('Transferência realizada com sucesso!')
    } catch (error) {
      setErroTransferencia(error.message || 'Erro ao realizar transferência.')
    }

    setCarregandoTransferencia(false)
  }

  // ==========================================
  // CALCULAR SALDO TOTAL
  // ==========================================
  const saldoTotal = contas.reduce((acc, conta) => acc + (conta.saldoAtual || 0), 0)
  const contasAtivas = contas.filter(c => c.status === 'ativo')

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
            🏦 Contas Bancárias
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${contas.length} conta(s) cadastrada(s) · Saldo Total: ${formatarMoeda(saldoTotal)}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={abrirModalTransferencia}
            style={{
              backgroundColor: 'rgba(58,122,189,0.2)',
              color: '#3a7abd',
              border: '1px solid rgba(58,122,189,0.2)',
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
            🔄 Transferir
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
            ➕ Nova Conta
          </button>
        </div>
      </div>

      {/* LISTA DE CONTAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {carregando ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center' }}>
            Carregando contas...
          </p>
        ) : contas.length === 0 ? (
          <div style={{ 
            gridColumn: '1/-1', 
            textAlign: 'center', 
            padding: '40px 0',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma conta cadastrada</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
              Clique em "Nova Conta" para começar
            </p>
          </div>
        ) : (
          contas.map(conta => (
            <div key={conta.id} style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '12px',
              border: `1px solid ${conta.status === 'ativo' ? 'rgba(255,255,255,0.08)' : 'rgba(217,74,74,0.3)'}`,
              opacity: conta.status === 'ativo' ? 1 : 0.5,
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#1a2b4a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  {conta.logo || '🏦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0' }}>
                    {conta.nomeExibicao || conta.instituicao}
                  </h3>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.3)', 
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    margin: '2px 0 0 0'
                  }}>
                    {conta.tipo || 'Conta Corrente'}
                  </p>
                </div>
                {conta.status === 'inativo' && (
                  <span style={{
                    backgroundColor: '#d94a4a',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    INATIVA
                  </span>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Saldo Atual</span>
                  <span style={{ 
                    color: (conta.saldoAtual || 0) >= 0 ? '#2d8a4e' : '#d94a4a',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {formatarMoeda(conta.saldoAtual || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                    Saldo Inicial: {formatarMoeda(conta.saldoInicial || 0)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
                    {conta.dataAbertura || '-'}
                  </span>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                marginTop: '14px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '12px'
              }}>
                <button
                  onClick={() => abrirModalEditar(conta)}
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
                  ✏️ Editar
                </button>
                <button
                  onClick={() => inativarConta(conta.id, conta.status)}
                  style={{
                    flex: 1,
                    backgroundColor: conta.status === 'ativo' 
                      ? 'rgba(217,74,74,0.2)' 
                      : 'rgba(45,138,78,0.2)',
                    color: conta.status === 'ativo' ? '#d94a4a' : '#2d8a4e',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {conta.status === 'ativo' ? '🔒 Inativar' : '🔓 Ativar'}
                </button>
                <button
                  onClick={() => excluirConta(conta.id, conta.nomeExibicao || conta.instituicao)}
                  style={{
                    flex: 0.5,
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
          MODAL - CONTA
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
              {modalEdicao ? '✏️ Editar Conta' : '➕ Nova Conta'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicao ? 'Atualize os dados da conta' : 'Cadastre uma nova conta bancária'}
            </p>

            <form onSubmit={salvarConta}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  🏦 Instituição
                </label>
                <select
                  value={formData.instituicao}
                  onChange={(e) => {
                    const banco = BANCOS.find(b => b.nome === e.target.value)
                    setFormData({ 
                      ...formData, 
                      instituicao: e.target.value,
                      logo: banco?.emoji || '🏦'
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
                  <option value="">Selecione um banco</option>
                  {BANCOS.map(banco => (
                    <option key={banco.nome} value={banco.nome} style={{ backgroundColor: '#1a2b4a' }}>
                      {banco.emoji} {banco.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📋 Tipo de Conta
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
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
                  <option value="corrente">💳 Conta Corrente</option>
                  <option value="poupanca">🏦 Poupança</option>
                  <option value="salario">💰 Conta Salário</option>
                  <option value="investimento">📈 Investimento</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  💰 Saldo Inicial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.saldoInicial}
                  onChange={(e) => setFormData({ ...formData, saldoInicial: e.target.value })}
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📅 Data de Abertura
                </label>
                <input
                  type="date"
                  value={formData.dataAbertura}
                  onChange={(e) => setFormData({ ...formData, dataAbertura: e.target.value })}
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
          MODAL - TRANSFERÊNCIA
          ========================================== */}
      {modalTransferenciaAberto && (
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
        }} onClick={() => setModalTransferenciaAberto(false)}>
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              🔄 Transferência entre Contas
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              Mova dinheiro de uma conta para outra
            </p>

            {erroTransferencia && (
              <div style={{
                backgroundColor: 'rgba(217,74,74,0.2)',
                border: '1px solid #d94a4a',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#d94a4a',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {erroTransferencia}
              </div>
            )}

            <form onSubmit={realizarTransferencia}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📤 Conta de Origem
                </label>
                <select
                  value={transferencia.contaOrigemId}
                  onChange={(e) => setTransferencia({ ...transferencia, contaOrigemId: e.target.value })}
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
                  <option value="">Selecione a conta de origem</option>
                  {contas.filter(c => c.status === 'ativo').map(conta => (
                    <option key={conta.id} value={conta.id} style={{ backgroundColor: '#1a2b4a' }}>
                      {conta.nomeExibicao || conta.instituicao} - {formatarMoeda(conta.saldoAtual || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📥 Conta de Destino
                </label>
                <select
                  value={transferencia.contaDestinoId}
                  onChange={(e) => setTransferencia({ ...transferencia, contaDestinoId: e.target.value })}
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
                  <option value="">Selecione a conta de destino</option>
                  {contas.filter(c => c.status === 'ativo').map(conta => (
                    <option key={conta.id} value={conta.id} style={{ backgroundColor: '#1a2b4a' }}>
                      {conta.nomeExibicao || conta.instituicao}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  💰 Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={transferencia.valor}
                  onChange={(e) => setTransferencia({ ...transferencia, valor: e.target.value })}
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  📝 Descrição (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Transferência para investimentos"
                  value={transferencia.descricao}
                  onChange={(e) => setTransferencia({ ...transferencia, descricao: e.target.value })}
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
                  onClick={() => setModalTransferenciaAberto(false)}
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
                  disabled={carregandoTransferencia}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: carregandoTransferencia ? 'rgba(255,255,255,0.1)' : '#2d8a4e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: carregandoTransferencia ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {carregandoTransferencia ? '🔄 Processando...' : '🔄 Transferir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contas