// src/pages/Contas.jsx
import React, { useState, useEffect } from 'react'
import { 
  buscarContas, 
  adicionarConta, 
  atualizarConta, 
  excluirConta 
} from '../firebase/contasService'

// Lista de bancos com emojis e cores
const BANCOS = [
  { nome: 'Nubank', emoji: '🟣', cor: '#8B5CF6' },
  { nome: 'Itaú', emoji: '🟠', cor: '#EC7000' },
  { nome: 'Bradesco', emoji: '🔴', cor: '#CC092F' },
  { nome: 'Santander', emoji: '🔵', cor: '#EC0000' },
  { nome: 'Inter', emoji: '🟧', cor: '#FF7A00' },
  { nome: 'Inter Empresa', emoji: '🟧', cor: '#0b6e14ff' },
  { nome: 'C6 Bank', emoji: '⬛', cor: '#1A1A1A' },
  { nome: 'PicPay', emoji: '🟩', cor: '#21C25E' },
  { nome: 'Mercado Pago', emoji: '🟦', cor: '#00AEEF' },
  { nome: 'XP Investimentos', emoji: '🟢', cor: '#0A7E3F' },
  { nome: 'Outro', emoji: '🏦', cor: '#6B7280' }
]

function Contas() {
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [modalEdicao, setModalEdicao] = useState(false)
  
  const [formData, setFormData] = useState({
    id: null,
    instituicao: '',
    nomePersonalizado: '',
    tipo: 'corrente',
    logo: '🏦',
    cor: '#6B7280',
    saldoInicial: '',
    dataAbertura: new Date().toISOString().split('T')[0]
  })

  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1)
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())

  const carregarContas = async () => {
    setCarregando(true)
    const dados = await buscarContas()
    setContas(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarContas()
  }, [])

  const abrirModalNovo = () => {
    setFormData({
      id: null,
      instituicao: '',
      nomePersonalizado: '',
      tipo: 'corrente',
      logo: '🏦',
      cor: '#6B7280',
      saldoInicial: '',
      dataAbertura: new Date().toISOString().split('T')[0]
    })
    setModalEdicao(false)
    setModalAberto(true)
  }

  const abrirModalEditar = (conta) => {
    setFormData({
      id: conta.id,
      instituicao: conta.instituicao || '',
      nomePersonalizado: conta.nomePersonalizado || '',
      tipo: conta.tipo || 'corrente',
      logo: conta.logo || '🏦',
      cor: conta.cor || '#6B7280',
      saldoInicial: conta.saldoInicial || '',
      dataAbertura: conta.dataAbertura || new Date().toISOString().split('T')[0]
    })
    setModalEdicao(true)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
  }

  const handleBancoChange = (valor) => {
    const banco = BANCOS.find(b => b.nome === valor)
    setFormData({ 
      ...formData, 
      instituicao: valor,
      logo: banco?.emoji || '🏦',
      cor: banco?.cor || '#6B7280'
    })
  }

  const salvarConta = async (e) => {
    e.preventDefault()
    
    const nomeExibicao = formData.nomePersonalizado?.trim() || formData.instituicao

    if (!nomeExibicao) {
      alert('Digite o nome da instituição ou um nome personalizado.')
      return
    }

    const dadosParaSalvar = {
      instituicao: formData.instituicao,
      nomePersonalizado: formData.nomePersonalizado?.trim() || '',
      nomeExibicao: nomeExibicao,
      tipo: formData.tipo,
      logo: formData.logo,
      cor: formData.cor,
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
      fecharModal()
    } catch (error) {
      alert('Erro ao salvar conta.')
      console.error(error)
    }
  }

  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Excluir a conta "${nome}"?`)) {
      await excluirConta(id)
      await carregarContas()
    }
  }

  const handleInativar = async (id, statusAtual) => {
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

  const formatarMoeda = (valor) => {
    return `R$ ${(valor || 0).toFixed(2).replace('.', ',')}`
  }

  const contasFiltradas = contas.filter(conta => {
    if (!conta.dataAbertura) return true
    const data = new Date(conta.dataAbertura)
    return data.getMonth() + 1 === filtroMes && data.getFullYear() === filtroAno
  })

  const saldoTotal = contas.reduce((acc, conta) => acc + (conta.saldoAtual || 0), 0)

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
          <h2 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '4px' }}>
            🏦 Contas Bancárias
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${contas.length} conta(s) cadastrada(s) · Saldo Total: ${formatarMoeda(saldoTotal)}`}
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
          ➕ Nova Conta
        </button>
      </div>

      {/* FILTROS */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '15px 20px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Mês:</label>
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
                {new Date(2024, m-1).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Ano:</label>
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
          contasFiltradas.map(conta => (
            <div key={conta.id} style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '12px',
              border: `1px solid ${conta.status === 'ativo' ? 'rgba(255,255,255,0.08)' : 'rgba(217,74,74,0.3)'}`,
              opacity: conta.status === 'ativo' ? 1 : 0.5,
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                {/* Logo com fundo colorido */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: conta.cor || '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  {conta.logo || '🏦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    color: '#fff', 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conta.nomeExibicao || conta.instituicao}
                  </h3>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.3)', 
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    margin: 0
                  }}>
                    {conta.tipo || 'Conta Corrente'}
                    {conta.instituicao && conta.instituicao !== (conta.nomeExibicao || conta.instituicao) && (
                      <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: '6px' }}>
                        ({conta.instituicao})
                      </span>
                    )}
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
                    {conta.dataAbertura}
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
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.6)',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    flex: 1
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleInativar(conta.id, conta.status)}
                  style={{
                    backgroundColor: conta.status === 'ativo' 
                      ? 'rgba(217,74,74,0.2)' 
                      : 'rgba(45,138,78,0.2)',
                    color: conta.status === 'ativo' ? '#d94a4a' : '#2d8a4e',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    flex: 1
                  }}
                >
                  {conta.status === 'ativo' ? '🔒 Inativar' : '🔓 Ativar'}
                </button>
                <button
                  onClick={() => handleExcluir(conta.id, conta.nomeExibicao || conta.instituicao)}
                  style={{
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
          MODAL - NOVA/EDITAR CONTA
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
        }} onClick={fecharModal}>
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
              {/* Instituição (seleção) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  🏦 Instituição
                </label>
                <select
                  value={formData.instituicao}
                  onChange={(e) => handleBancoChange(e.target.value)}
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

              {/* Nome Personalizado */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  ✏️ Nome Personalizado (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conta do Nubank, Poupança do Itaú..."
                  value={formData.nomePersonalizado}
                  onChange={(e) => setFormData({ ...formData, nomePersonalizado: e.target.value })}
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
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px' }}>
                  Deixe em branco para usar o nome da instituição
                </p>
              </div>

              {/* Logo (visualização) */}
              {formData.logo && (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: formData.cor || '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    {formData.logo}
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                      Pré-visualização do logo
                    </p>
                    <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
                      {formData.nomePersonalizado || formData.instituicao || 'Nome da conta'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tipo */}
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
                  <option value="corrente" style={{ backgroundColor: '#1a2b4a' }}>💳 Conta Corrente</option>
                  <option value="poupanca" style={{ backgroundColor: '#1a2b4a' }}>🏦 Poupança</option>
                  <option value="salario" style={{ backgroundColor: '#1a2b4a' }}>💰 Conta Salário</option>
                  <option value="investimento" style={{ backgroundColor: '#1a2b4a' }}>📈 Investimento</option>
                </select>
              </div>

              {/* Saldo Inicial */}
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

              {/* Data de Abertura */}
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

export default Contas