import React, { useState, useEffect } from 'react'
import { useConfig } from '../contexts/ConfigContext'
import { auth } from '../firebase/firebase'

function Configuracoes() {
  const { config, atualizarConfig, recarregar } = useConfig()
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [mensagemTipo, setMensagemTipo] = useState('')

  const [formData, setFormData] = useState({
    tema: 'dark',
    moeda: 'R$',
    formatoData: 'DD/MM/YYYY',
    notificacoes: true
  })

  const user = auth.currentUser

  useEffect(() => {
    if (config) {
      setFormData({
        tema: config.tema || 'dark',
        moeda: config.moeda || 'R$',
        formatoData: config.formatoData || 'DD/MM/YYYY',
        notificacoes: config.notificacoes !== undefined ? config.notificacoes : true
      })
    }
  }, [config])

  const salvarConfiguracoes = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setMensagem('')

    try {
      await atualizarConfig(formData)
      setMensagem('✅ Configurações salvas com sucesso!')
      setMensagemTipo('sucesso')
    } catch (error) {
      setMensagem('❌ Erro ao salvar configurações. Tente novamente.')
      setMensagemTipo('erro')
      console.error(error)
    }

    setCarregando(false)
  }

  const handleChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor })
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div>
      {/* CABEÇALHO */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '4px' }}>
          ⚙️ Configurações
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          Personalize o sistema de acordo com suas preferências
        </p>
      </div>

      {/* MENSAGEM */}
      {mensagem && (
        <div style={{
          backgroundColor: mensagemTipo === 'sucesso' 
            ? 'rgba(45,138,78,0.2)' 
            : 'rgba(217,74,74,0.2)',
          border: `1px solid ${mensagemTipo === 'sucesso' ? '#2d8a4e' : '#d94a4a'}`,
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: mensagemTipo === 'sucesso' ? '#2d8a4e' : '#d94a4a',
          fontSize: '14px'
        }}>
          {mensagem}
        </div>
      )}

      {/* PERFIL */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '16px' }}>
          👤 Perfil do Usuário
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 4px 0' }}>
              Nome
            </p>
            <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500', margin: 0 }}>
              {user?.displayName || 'Usuário'}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 4px 0' }}>
              E-mail
            </p>
            <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500', margin: 0 }}>
              {user?.email || 'Não informado'}
            </p>
          </div>
        </div>
      </div>

      {/* CONFIGURAÇÕES */}
      <form onSubmit={salvarConfiguracoes}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '16px' }}>
            🎨 Aparência
          </h3>

          {/* Tema */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Tema
            </label>
            <select
              value={formData.tema}
              onChange={(e) => handleChange('tema', e.target.value)}
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
              <option value="dark" style={{ backgroundColor: '#1a2b4a' }}>🌙 Dark (Escuro)</option>
              <option value="light" style={{ backgroundColor: '#1a2b4a' }}>☀️ Light (Claro)</option>
            </select>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '16px' }}>
            💰 Formatação
          </h3>

          {/* Moeda */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Símbolo da Moeda
            </label>
            <select
              value={formData.moeda}
              onChange={(e) => handleChange('moeda', e.target.value)}
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
              <option value="R$" style={{ backgroundColor: '#1a2b4a' }}>R$ (Real)</option>
              <option value="US$" style={{ backgroundColor: '#1a2b4a' }}>US$ (Dólar)</option>
              <option value="€" style={{ backgroundColor: '#1a2b4a' }}>€ (Euro)</option>
            </select>
          </div>

          {/* Formato de Data */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Formato de Data
            </label>
            <select
              value={formData.formatoData}
              onChange={(e) => handleChange('formatoData', e.target.value)}
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
              <option value="DD/MM/YYYY" style={{ backgroundColor: '#1a2b4a' }}>DD/MM/AAAA</option>
              <option value="MM/DD/YYYY" style={{ backgroundColor: '#1a2b4a' }}>MM/DD/AAAA</option>
            </select>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '16px' }}>
            🔔 Notificações
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.notificacoes}
                onChange={(e) => handleChange('notificacoes', e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#2d8a4e',
                  cursor: 'pointer'
                }}
              />
              Receber alertas e notificações
            </label>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px', marginLeft: '30px' }}>
              Alertas de vencimento, limites de cartão e metas atingidas
            </p>
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <button
          type="submit"
          disabled={carregando}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: carregando ? 'rgba(255,255,255,0.1)' : '#2d8a4e',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: carregando ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!carregando) e.target.style.backgroundColor = '#1a6a3a'
          }}
          onMouseLeave={(e) => {
            if (!carregando) e.target.style.backgroundColor = '#2d8a4e'
          }}
        >
          {carregando ? (
            <>
              <span style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid #fff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Salvando...
            </>
          ) : (
            '💾 Salvar Configurações'
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Configuracoes