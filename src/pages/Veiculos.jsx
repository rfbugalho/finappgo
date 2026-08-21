import React, { useState, useEffect } from 'react'
import { 
  buscarVeiculos, 
  adicionarVeiculo, 
  atualizarVeiculo, 
  excluirVeiculo,
  buscarAbastecimentos,
  adicionarAbastecimento,
  atualizarAbastecimento,
  excluirAbastecimento,
  buscarManutencoes,
  adicionarManutencao,
  atualizarManutencao,
  excluirManutencao
} from '../firebase/veiculosService'

function Veiculos() {
  // ==========================================
  // ESTADOS PRINCIPAIS
  // ==========================================
  const [veiculos, setVeiculos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null)
  const [abastecimentos, setAbastecimentos] = useState([])
  const [manutencoes, setManutencoes] = useState([])
  const [abaAberta, setAbaAberta] = useState('abastecimentos')

  // ==========================================
  // MODAL VEÍCULO
  // ==========================================
  const [modalVeiculoAberto, setModalVeiculoAberto] = useState(false)
  const [modalEdicaoVeiculo, setModalEdicaoVeiculo] = useState(false)
  const [formVeiculo, setFormVeiculo] = useState({
    id: null,
    nome: '',
    marca: '',
    modelo: '',
    ano: '',
    placa: '',
    cor: '',
    kmAtual: ''
  })

  // ==========================================
  // MODAL ABASTECIMENTO
  // ==========================================
  const [modalAbastecimentoAberto, setModalAbastecimentoAberto] = useState(false)
  const [modalEdicaoAbastecimento, setModalEdicaoAbastecimento] = useState(false)
  const [formAbastecimento, setFormAbastecimento] = useState({
    id: null,
    veiculoId: '',
    data: new Date().toISOString().split('T')[0],
    kmInicial: '',
    kmFinal: '',
    litros: '',
    combustivel: 'gasolina',
    posto: '',
    valor: ''
  })

  // ==========================================
  // MODAL MANUTENÇÃO
  // ==========================================
  const [modalManutencaoAberto, setModalManutencaoAberto] = useState(false)
  const [modalEdicaoManutencao, setModalEdicaoManutencao] = useState(false)
  const [formManutencao, setFormManutencao] = useState({
    id: null,
    veiculoId: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'revisao',
    descricao: '',
    valor: ''
  })

  const tiposCombustivel = ['gasolina', 'etanol', 'diesel', 'gnv']
  const tiposManutencao = ['revisao', 'ipva', 'licenciamento', 'estacionamento', 'pedagio', 'outros']

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarVeiculos = async () => {
    setCarregando(true)
    const dados = await buscarVeiculos()
    setVeiculos(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarVeiculos()
  }, [])

  // ==========================================
  // FUNÇÕES DO VEÍCULO
  // ==========================================
  const abrirModalNovoVeiculo = () => {
    setFormVeiculo({
      id: null,
      nome: '',
      marca: '',
      modelo: '',
      ano: '',
      placa: '',
      cor: '',
      kmAtual: ''
    })
    setModalEdicaoVeiculo(false)
    setModalVeiculoAberto(true)
  }

  const abrirModalEditarVeiculo = (veiculo) => {
    setFormVeiculo({
      id: veiculo.id,
      nome: veiculo.nome,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      placa: veiculo.placa,
      cor: veiculo.cor,
      kmAtual: veiculo.kmAtual || ''
    })
    setModalEdicaoVeiculo(true)
    setModalVeiculoAberto(true)
  }

  const salvarVeiculo = async (e) => {
    e.preventDefault()
    
    if (!formVeiculo.nome.trim()) {
      alert('Digite um nome para o veículo.')
      return
    }

    const dadosParaSalvar = {
      nome: formVeiculo.nome.trim(),
      marca: formVeiculo.marca,
      modelo: formVeiculo.modelo,
      ano: formVeiculo.ano,
      placa: formVeiculo.placa,
      cor: formVeiculo.cor,
      kmAtual: parseFloat(formVeiculo.kmAtual) || 0
    }

    try {
      if (modalEdicaoVeiculo) {
        await atualizarVeiculo(formVeiculo.id, dadosParaSalvar)
      } else {
        await adicionarVeiculo(dadosParaSalvar)
      }
      
      await carregarVeiculos()
      setModalVeiculoAberto(false)
    } catch (error) {
      alert('Erro ao salvar veículo. Tente novamente.')
      console.error(error)
    }
  }

  const excluirVeiculo = async (id, nome) => {
    if (window.confirm(`Excluir o veículo "${nome}"?`)) {
      await excluirVeiculo(id)
      await carregarVeiculos()
      if (veiculoSelecionado?.id === id) {
        setVeiculoSelecionado(null)
      }
    }
  }

  // ==========================================
  // FUNÇÕES DE ABASTECIMENTO
  // ==========================================
  const carregarAbastecimentos = async (veiculoId) => {
    const dados = await buscarAbastecimentos(veiculoId)
    setAbastecimentos(dados)
  }

  const abrirModalNovoAbastecimento = (veiculoId) => {
    const veiculo = veiculos.find(v => v.id === veiculoId)
    setFormAbastecimento({
      id: null,
      veiculoId: veiculoId,
      data: new Date().toISOString().split('T')[0],
      kmInicial: veiculo?.kmAtual || '',
      kmFinal: '',
      litros: '',
      combustivel: 'gasolina',
      posto: '',
      valor: ''
    })
    setModalEdicaoAbastecimento(false)
    setModalAbastecimentoAberto(true)
  }

  const abrirModalEditarAbastecimento = (abastecimento) => {
    setFormAbastecimento({
      id: abastecimento.id,
      veiculoId: abastecimento.veiculoId,
      data: abastecimento.data,
      kmInicial: abastecimento.kmInicial,
      kmFinal: abastecimento.kmFinal,
      litros: abastecimento.litros,
      combustivel: abastecimento.combustivel,
      posto: abastecimento.posto,
      valor: abastecimento.valor
    })
    setModalEdicaoAbastecimento(true)
    setModalAbastecimentoAberto(true)
  }

  const salvarAbastecimento = async (e) => {
    e.preventDefault()
    
    const kmInicial = parseFloat(formAbastecimento.kmInicial)
    const kmFinal = parseFloat(formAbastecimento.kmFinal)
    const litros = parseFloat(formAbastecimento.litros)
    const valor = parseFloat(formAbastecimento.valor)

    if (isNaN(kmInicial) || isNaN(kmFinal) || kmFinal <= kmInicial) {
      alert('KM final deve ser maior que KM inicial.')
      return
    }

    if (isNaN(litros) || litros <= 0) {
      alert('Digite uma quantidade de litros válida.')
      return
    }

    const dadosParaSalvar = {
      veiculoId: formAbastecimento.veiculoId,
      data: formAbastecimento.data,
      kmInicial: kmInicial,
      kmFinal: kmFinal,
      litros: litros,
      combustivel: formAbastecimento.combustivel,
      posto: formAbastecimento.posto,
      valor: valor
    }

    try {
      if (modalEdicaoAbastecimento) {
        await atualizarAbastecimento(formAbastecimento.id, dadosParaSalvar)
      } else {
        await adicionarAbastecimento(dadosParaSalvar)
      }
      
      await carregarAbastecimentos(formAbastecimento.veiculoId)
      await carregarVeiculos()
      setModalAbastecimentoAberto(false)
    } catch (error) {
      alert('Erro ao salvar abastecimento.')
      console.error(error)
    }
  }

  const excluirAbastecimento = async (id, veiculoId) => {
    if (window.confirm('Excluir este abastecimento?')) {
      await excluirAbastecimento(id, veiculoId)
      await carregarAbastecimentos(veiculoId)
      await carregarVeiculos()
    }
  }

  // ==========================================
  // FUNÇÕES DE MANUTENÇÃO
  // ==========================================
  const carregarManutencoes = async (veiculoId) => {
    const dados = await buscarManutencoes(veiculoId)
    setManutencoes(dados)
  }

  const abrirModalNovaManutencao = (veiculoId) => {
    setFormManutencao({
      id: null,
      veiculoId: veiculoId,
      data: new Date().toISOString().split('T')[0],
      tipo: 'revisao',
      descricao: '',
      valor: ''
    })
    setModalEdicaoManutencao(false)
    setModalManutencaoAberto(true)
  }

  const abrirModalEditarManutencao = (manutencao) => {
    setFormManutencao({
      id: manutencao.id,
      veiculoId: manutencao.veiculoId,
      data: manutencao.data,
      tipo: manutencao.tipo,
      descricao: manutencao.descricao,
      valor: manutencao.valor
    })
    setModalEdicaoManutencao(true)
    setModalManutencaoAberto(true)
  }

  const salvarManutencao = async (e) => {
    e.preventDefault()
    
    const valor = parseFloat(formManutencao.valor)
    if (isNaN(valor) || valor <= 0) {
      alert('Digite um valor válido.')
      return
    }

    const dadosParaSalvar = {
      veiculoId: formManutencao.veiculoId,
      data: formManutencao.data,
      tipo: formManutencao.tipo,
      descricao: formManutencao.descricao,
      valor: valor
    }

    try {
      if (modalEdicaoManutencao) {
        await atualizarManutencao(formManutencao.id, dadosParaSalvar)
      } else {
        await adicionarManutencao(dadosParaSalvar)
      }
      
      await carregarManutencoes(formManutencao.veiculoId)
      setModalManutencaoAberto(false)
    } catch (error) {
      alert('Erro ao salvar manutenção.')
      console.error(error)
    }
  }

  const excluirManutencao = async (id, veiculoId) => {
    if (window.confirm('Excluir esta manutenção?')) {
      await excluirManutencao(id, veiculoId)
      await carregarManutencoes(veiculoId)
    }
  }

  // ==========================================
  // FUNÇÕES DE SELEÇÃO
  // ==========================================
  const selecionarVeiculo = async (veiculo) => {
    setVeiculoSelecionado(veiculo)
    await carregarAbastecimentos(veiculo.id)
    await carregarManutencoes(veiculo.id)
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
            🚗 Veículos
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${veiculos.length} veículo(s) cadastrado(s)`}
          </p>
        </div>
        <button
          onClick={abrirModalNovoVeiculo}
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
          ➕ Novo Veículo
        </button>
      </div>

      {/* LISTA DE VEÍCULOS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: veiculoSelecionado ? '1fr 2fr' : '1fr',
        gap: '20px'
      }}>
        {/* COLUDA ESQUERDA: LISTA DE VEÍCULOS */}
        <div>
          {carregando ? (
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Carregando veículos...</p>
          ) : veiculos.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum veículo cadastrado</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                Clique em "Novo Veículo" para começar
              </p>
            </div>
          ) : (
            veiculos.map(veiculo => (
              <div 
                key={veiculo.id} 
                onClick={() => selecionarVeiculo(veiculo)}
                style={{
                  backgroundColor: veiculoSelecionado?.id === veiculo.id 
                    ? 'rgba(58,122,189,0.2)' 
                    : 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  border: veiculoSelecionado?.id === veiculo.id 
                    ? '1px solid #3a7abd' 
                    : '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#fff', margin: 0 }}>{veiculo.nome}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '4px 0 0 0' }}>
                      {veiculo.marca} {veiculo.modelo} · {veiculo.ano}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '2px 0 0 0' }}>
                      KM: {veiculo.kmAtual || 0} km
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); abrirModalEditarVeiculo(veiculo); }}
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
                      onClick={(e) => { e.stopPropagation(); excluirVeiculo(veiculo.id, veiculo.nome); }}
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

        {/* COLUNA DIREITA: DETALHES DO VEÍCULO */}
        {veiculoSelecionado && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {/* Cabeçalho do veículo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>{veiculoSelecionado.nome}</h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: '2px 0 0 0' }}>
                  {veiculoSelecionado.marca} {veiculoSelecionado.modelo} · {veiculoSelecionado.ano} · {veiculoSelecionado.placa || 'Sem placa'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => abrirModalNovoAbastecimento(veiculoSelecionado.id)}
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
                  ⛽ Abastecer
                </button>
                <button
                  onClick={() => abrirModalNovaManutencao(veiculoSelecionado.id)}
                  style={{
                    backgroundColor: 'rgba(237,137,54,0.2)',
                    color: '#ed8936',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  🔧 Manutenção
                </button>
              </div>
            </div>

            {/* Resumo do veículo */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '8px'
            }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>KM Atual</p>
                <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  {veiculoSelecionado.kmAtual || 0} km
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>Total Abastecimentos</p>
                <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  {abastecimentos.length}
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>KM/L Médio</p>
                <p style={{ color: '#2d8a4e', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  {abastecimentos.length > 0 
                    ? (abastecimentos.reduce((acc, a) => acc + a.kmPorLitro, 0) / abastecimentos.length).toFixed(1)
                    : '--'
                  }
                </p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>Gasto Total</p>
                <p style={{ color: '#fc8181', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  {formatarMoeda(
                    abastecimentos.reduce((acc, a) => acc + (a.valor || 0), 0) +
                    manutencoes.reduce((acc, m) => acc + (m.valor || 0), 0)
                  )}
                </p>
              </div>
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setAbaAberta('abastecimentos')}
                style={{
                  padding: '8px 20px',
                  backgroundColor: 'transparent',
                  color: abaAberta === 'abastecimentos' ? '#3a7abd' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  borderBottom: abaAberta === 'abastecimentos' ? '2px solid #3a7abd' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                ⛽ Abastecimentos
              </button>
              <button
                onClick={() => setAbaAberta('manutencoes')}
                style={{
                  padding: '8px 20px',
                  backgroundColor: 'transparent',
                  color: abaAberta === 'manutencoes' ? '#3a7abd' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  borderBottom: abaAberta === 'manutencoes' ? '2px solid #3a7abd' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                🔧 Manutenções
              </button>
            </div>

            {/* Conteúdo da aba - Abastecimentos */}
            {abaAberta === 'abastecimentos' && (
              <div>
                {abastecimentos.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
                    Nenhum abastecimento registrado
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'rgba(255,255,255,0.3)' }}>Data</th>
                          <th style={{ padding: '8px', textAlign: 'left', color: 'rgba(255,255,255,0.3)' }}>Posto</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: 'rgba(255,255,255,0.3)' }}>KM</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: 'rgba(255,255,255,0.3)' }}>Litros</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: 'rgba(255,255,255,0.3)' }}>KM/L</th>
                          <th style={{ padding: '8px', textAlign: 'right', color: 'rgba(255,255,255,0.3)' }}>Valor</th>
                          <th style={{ padding: '8px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abastecimentos.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px' }}>{formatarData(item.data)}</td>
                            <td style={{ padding: '8px' }}>{item.posto || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{item.kmInicial} → {item.kmFinal}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{item.litros}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#2d8a4e' }}>
                              {item.kmPorLitro?.toFixed(1) || '-'}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#fc8181' }}>
                              {formatarMoeda(item.valor)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                onClick={() => abrirModalEditarAbastecimento(item)}
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
                                onClick={() => excluirAbastecimento(item.id, item.veiculoId)}
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

            {/* Conteúdo da aba - Manutenções */}
            {abaAberta === 'manutencoes' && (
              <div>
                {manutencoes.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
                    Nenhuma manutenção registrada
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
                        {manutencoes.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px' }}>{formatarData(item.data)}</td>
                            <td style={{ padding: '8px', textTransform: 'capitalize' }}>{item.tipo}</td>
                            <td style={{ padding: '8px' }}>{item.descricao || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#fc8181' }}>
                              {formatarMoeda(item.valor)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                onClick={() => abrirModalEditarManutencao(item)}
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
                                onClick={() => excluirManutencao(item.id, item.veiculoId)}
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
          MODAL - VEÍCULO
          ========================================== */}
      {modalVeiculoAberto && (
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
        }} onClick={() => setModalVeiculoAberto(false)}>
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
              {modalEdicaoVeiculo ? '✏️ Editar Veículo' : '🚗 Novo Veículo'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicaoVeiculo ? 'Atualize os dados do veículo' : 'Cadastre um novo veículo'}
            </p>

            <form onSubmit={salvarVeiculo}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Nome do Veículo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Meu Carro, Gol, Uno..."
                  value={formVeiculo.nome}
                  onChange={(e) => setFormVeiculo({ ...formVeiculo, nome: e.target.value })}
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
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Volkswagen, Fiat..."
                    value={formVeiculo.marca}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, marca: e.target.value })}
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
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Gol, Onix..."
                    value={formVeiculo.modelo}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, modelo: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    Ano
                  </label>
                  <input
                    type="number"
                    placeholder="2020"
                    value={formVeiculo.ano}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, ano: e.target.value })}
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
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    Placa
                  </label>
                  <input
                    type="text"
                    placeholder="ABC-1234"
                    value={formVeiculo.placa}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, placa: e.target.value })}
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
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    Cor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Branco, Prata..."
                    value={formVeiculo.cor}
                    onChange={(e) => setFormVeiculo({ ...formVeiculo, cor: e.target.value })}
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  📍 KM Atual
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formVeiculo.kmAtual}
                  onChange={(e) => setFormVeiculo({ ...formVeiculo, kmAtual: e.target.value })}
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
                  onClick={() => setModalVeiculoAberto(false)}
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
                  {modalEdicaoVeiculo ? '💾 Atualizar' : '➕ Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL - ABASTECIMENTO
          ========================================== */}
      {modalAbastecimentoAberto && (
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
        }} onClick={() => setModalAbastecimentoAberto(false)}>
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
              {modalEdicaoAbastecimento ? '✏️ Editar Abastecimento' : '⛽ Novo Abastecimento'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicaoAbastecimento ? 'Atualize os dados do abastecimento' : 'Registre um novo abastecimento'}
            </p>

            <form onSubmit={salvarAbastecimento}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  📅 Data
                </label>
                <input
                  type="date"
                  value={formAbastecimento.data}
                  onChange={(e) => setFormAbastecimento({ ...formAbastecimento, data: e.target.value })}
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
                    📍 KM Inicial
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formAbastecimento.kmInicial}
                    onChange={(e) => setFormAbastecimento({ ...formAbastecimento, kmInicial: e.target.value })}
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
                    📍 KM Final
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formAbastecimento.kmFinal}
                    onChange={(e) => setFormAbastecimento({ ...formAbastecimento, kmFinal: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    ⛽ Litros
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formAbastecimento.litros}
                    onChange={(e) => setFormAbastecimento({ ...formAbastecimento, litros: e.target.value })}
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
                    💰 Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formAbastecimento.valor}
                    onChange={(e) => setFormAbastecimento({ ...formAbastecimento, valor: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    Tipo Combustível
                  </label>
                  <select
                    value={formAbastecimento.combustivel}
                    onChange={(e) => setFormAbastecimento({ ...formAbastecimento, combustivel: e.target.value })}
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
                    {tiposCombustivel.map(t => (
                      <option key={t} value={t} style={{ backgroundColor: '#1a2b4a', textTransform: 'capitalize' }}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    🏪 Posto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Shell, BR..."
                    value={formAbastecimento.posto}
                    onChange={(e) => setFormAbastecimento({ ...formAbastecimento, posto: e.target.value })}
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalAbastecimentoAberto(false)}
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
                  {modalEdicaoAbastecimento ? '💾 Atualizar' : '➕ Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL - MANUTENÇÃO
          ========================================== */}
      {modalManutencaoAberto && (
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
        }} onClick={() => setModalManutencaoAberto(false)}>
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
              {modalEdicaoManutencao ? '✏️ Editar Manutenção' : '🔧 Nova Manutenção'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              {modalEdicaoManutencao ? 'Atualize os dados da manutenção' : 'Registre uma nova manutenção'}
            </p>

            <form onSubmit={salvarManutencao}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  📅 Data
                </label>
                <input
                  type="date"
                  value={formManutencao.data}
                  onChange={(e) => setFormManutencao({ ...formManutencao, data: e.target.value })}
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
                  Tipo de Manutenção
                </label>
                <select
                  value={formManutencao.tipo}
                  onChange={(e) => setFormManutencao({ ...formManutencao, tipo: e.target.value })}
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
                  {tiposManutencao.map(t => (
                    <option key={t} value={t} style={{ backgroundColor: '#1a2b4a', textTransform: 'capitalize' }}>
                      {t === 'ipva' ? 'IPVA' : t === 'licenciamento' ? 'Licenciamento' : t === 'pedagio' ? 'Pedágio' : t}
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
                  placeholder="Ex: Troca de óleo, Revisão completa..."
                  value={formManutencao.descricao}
                  onChange={(e) => setFormManutencao({ ...formManutencao, descricao: e.target.value })}
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
                  value={formManutencao.valor}
                  onChange={(e) => setFormManutencao({ ...formManutencao, valor: e.target.value })}
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
                  onClick={() => setModalManutencaoAberto(false)}
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
                  {modalEdicaoManutencao ? '💾 Atualizar' : '➕ Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Veiculos