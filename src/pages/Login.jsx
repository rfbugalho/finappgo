import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/firebase'

function Login() {
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    try {
      // 👇 LOGIN REAL COM FIREBASE AUTH
      await signInWithEmailAndPassword(auth, email, senha)
      setCarregando(false)
      navigate('/')
    } catch (error) {
      setCarregando(false)
      
      // Tratamento de erros
      switch (error.code) {
        case 'auth/user-not-found':
          setErro('Usuário não encontrado. Verifique o e-mail.')
          break
        case 'auth/wrong-password':
          setErro('Senha incorreta. Tente novamente.')
          break
        case 'auth/invalid-email':
          setErro('E-mail inválido. Verifique o formato.')
          break
        default:
          setErro('Erro ao fazer login. Tente novamente.')
          console.error(error)
      }
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0d1b2a',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1a2b4a',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '420px',
        width: '100%',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '48px' }}>💰</span>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '8px 0 4px 0'
          }}>
            FinAppGO
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.4)',
            margin: 0
          }}>
            Controle Financeiro Pessoal
          </p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#ffffff',
            margin: 0
          }}>
            Acesse sua conta
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.4)',
            margin: '4px 0 0 0'
          }}>
            Informe suas credenciais para continuar
          </p>
        </div>

        {erro && (
          <div style={{
            backgroundColor: 'rgba(217,74,74,0.2)',
            border: '1px solid #d94a4a',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#d94a4a',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '6px'
            }}>
              Endereço de e-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '6px'
            }}>
              Senha
            </label>
            <input
              type="password"
              placeholder="********"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
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
                Entrando...
              </>
            ) : (
              'Entrar na Plataforma'
            )}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default Login