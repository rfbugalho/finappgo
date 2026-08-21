import React, { useState, useEffect } from 'react'
import { 
  buscarUsuarios, 
  convidarUsuario, 
  atualizarUsuario, 
  excluirUsuario,
  gerarSenhaTemporaria
} from '../firebase/usuariosService'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/firebase'

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  
  // Modal Convidar
  const [modalAberto, setModalAberto] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    permissao: 'visualizador'
  })
  const [senhaGerada, setSenhaGerada] = useState('')
  const [erro, setErro] = useState('')

  // Modal Editar
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)

  const permissoes = [
    { valor: 'admin', label: '👑 Administrador', descricao: 'Acesso total ao sistema' },
    { valor: 'editor', label: '✏️ Editor', descricao: 'Pode criar e editar lançamentos' },
    { valor: 'visualizador', label: '👀 Visualizador', descricao: 'Apenas visualização' }
  ]

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  const carregarUsuarios = async () => {
    setCarregando(true)
    const dados = await buscarUsuarios()
    setUsuarios(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  // ==========================================
  // FUNÇÕES
  // ==========================================
  const abrirModalConvidar = () => {
    const senha = gerarSenhaTemporaria()
    setSenhaGerada(senha)
    setFormData({
      nome: '',
      email: '',
      permissao: 'visualizador'
    })
    setErro('')
    setModalAberto(true)
  }

  const convidar = async (e) => {
    e.preventDefault()
    setErro('')

    if (!formData.nome.trim()) {
      setErro('Digite o nome do usuário.')
      return
    }

    if (!formData.email.trim()) {
      setErro('Digite o e-mail do usuário.')
      return
    }

    try {
      await convidarUsuario(
        formData.email,
        senhaGerada,
        formData.nome.trim(),
        formData.permissao
      )
      
      await carregarUsuarios()
      setModalAberto(false)
      alert(`Usuário convidado com sucesso!\n\nE-mail: ${formData.email}\nSenha: ${senhaGerada}\n\n⚠️ Anote a senha e compartilhe com o usuário!`)
    } catch (error) {
      console.error(error)
      if (error.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está em uso.')
      } else {
        setErro('Erro ao convidar usuário. Tente novamente.')
      }
    }
  }

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario)
    setModalEditarAberto(true)
  }

  const salvarEdicao = async (e) => {
    e.preventDefault()
    try {
      await atualizarUsuario(usuarioEditando.id, {
        nome: usuarioEditando.nome,
        permissao: usuarioEditando.permissao,
        status: usuarioEditando.status
      })
      await carregarUsuarios()
      setModalEditarAberto(false)
      alert('Usuário atualizado com sucesso!')
    } catch (error) {
      alert('Erro ao atualizar usuário.')
      console.error(error)
    }
  }

  const excluir = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
      await excluirUsuario(id)
      await carregarUsuarios()
    }
  }

  const reenviarSenha = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      alert(`E-mail de redefinição de senha enviado para ${email}`)
    } catch (error) {
      alert('Erro ao enviar e-mail de redefinição.')
      console.error(error)
    }
  }

  // ==========================================
  // FORMATADORES
  // ==========================================
  const getPermissaoLabel = (permissao) => {
    const p = permissoes.find(p => p.valor === permissao)
    return p ? p.label : permissao
  }

  const getStatusCor = (status) => {
    return status === 'ativo' ? '#2d8a4e' : '#d94a4a'
  }

  const getStatusLabel = (status) => {
    return status === 'ativo' ? '✅ Ativo' : '❌ Inativo'
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
            👥 Usuários
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {carregando ? 'Carregando...' : `${usuarios.length} usuário(s) cadastrado(s)`}
          </p>
        </div>
        <button
          onClick={abrirModalConvidar}
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
          ➕ Convidar Usuário
        </button>
      </div>

      {/* LISTA DE USUÁRIOS */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        overflowX: 'auto'
      }}>
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
            <p>🔄 Carregando usuários...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontSize: '18px' }}>Nenhum usuário cadastrado</p>
            <p style={{ fontSize: '14px' }}>Clique em "Convidar Usuário" para começar</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Nome</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>E-mail</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Permissão</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{usuario.nome}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{usuario.email}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      backgroundColor: usuario.permissao === 'admin' 
                        ? 'rgba(159,122,234,0.2)' 
                        : usuario.permissao === 'editor' 
                          ? 'rgba(58,122,189,0.2)' 
                          : 'rgba(255,255,255,0.05)',
                      color: usuario.permissao === 'admin' 
                        ? '#9f7aea' 
                        : usuario.permissao === 'editor' 
                          ? '#3a7abd' 
                          : 'rgba(255,255,255,0.6)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getPermissaoLabel(usuario.permissao)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      backgroundColor: `${getStatusCor(usuario.status)}22`,
                      color: getStatusCor(usuario.status),
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getStatusLabel(usuario.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => reenviarSenha(usuario.email)}
                      style={{
                        backgroundColor: 'rgba(58,122,189,0.2)',
                        color: '#3a7abd',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '4px'
                      }}
                    >
                      📧
                    </button>
                    <button
                      onClick={() => abrirModalEditar(usuario)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.6)',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '4px'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => excluir(usuario.id, usuario.nome)}
                      style={{
                        backgroundColor: 'rgba(217,74,74,0.2)',
                        color: '#d94a4a',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
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

      {/* ==========================================
          MODAL - CONVIDAR USUÁRIO
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
            maxWidth: '480px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              👤 Convidar Usuário
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              Crie uma nova conta para um usuário
            </p>

            {erro && (
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
                {erro}
              </div>
            )}

            <form onSubmit={convidar}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maria Silva"
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
                  E-mail *
                </label>
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Permissão
                </label>
                <select
                  value={formData.permissao}
                  onChange={(e) => setFormData({ ...formData, permissao: e.target.value })}
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
                  {permissoes.map(p => (
                    <option key={p.valor} value={p.valor} style={{ backgroundColor: '#1a2b4a' }}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px' }}>
                  {permissoes.find(p => p.valor === formData.permissao)?.descricao}
                </p>
              </div>

              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                  🔑 Senha gerada automaticamente:
                </p>
                <p style={{ 
                  color: '#2d8a4e', 
                  fontSize: '18px', 
                  fontWeight: '700',
                  margin: '4px 0 0 0',
                  fontFamily: 'monospace'
                }}>
                  {senhaGerada}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '4px 0 0 0' }}>
                  ⚠️ Anote esta senha e compartilhe com o usuário!
                </p>
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
                  👤 Convidar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL - EDITAR USUÁRIO
          ========================================== */}
      {modalEditarAberto && usuarioEditando && (
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
        }} onClick={() => setModalEditarAberto(false)}>
          <div style={{
            backgroundColor: '#1a2b4a',
            padding: '30px',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>
              ✏️ Editar Usuário
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
              Atualize os dados do usuário
            </p>

            <form onSubmit={salvarEdicao}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Nome
                </label>
                <input
                  type="text"
                  value={usuarioEditando.nome}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nome: e.target.value })}
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
                  Permissão
                </label>
                <select
                  value={usuarioEditando.permissao}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, permissao: e.target.value })}
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
                  {permissoes.map(p => (
                    <option key={p.valor} value={p.valor} style={{ backgroundColor: '#1a2b4a' }}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                  Status
                </label>
                <select
                  value={usuarioEditando.status}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, status: e.target.value })}
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
                  <option value="ativo" style={{ backgroundColor: '#1a2b4a' }}>✅ Ativo</option>
                  <option value="inativo" style={{ backgroundColor: '#1a2b4a' }}>❌ Inativo</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalEditarAberto(false)}
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
                  💾 Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Usuarios