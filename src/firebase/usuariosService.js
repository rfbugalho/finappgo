// src/firebase/usuariosService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy
} from 'firebase/firestore'
import { db, auth } from './firebase'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'

const COLLECTION_NAME = 'usuarios'

// ==========================================
// REGISTRAR OU BUSCAR USUÁRIO
// ==========================================
export const registrarOuBuscarUsuario = async (user) => {
  try {
    if (!user) throw new Error('Usuário não informado')

    // Verificar se o usuário já existe no Firestore
    const q = query(
      collection(db, COLLECTION_NAME),
      where('uid', '==', user.uid)
    )
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Usuário já existe, retornar dados
      let usuario = {}
      querySnapshot.forEach((doc) => {
        usuario = { id: doc.id, ...doc.data() }
      })
      return usuario
    }

    // Usuário não existe, criar novo registro
    const nome = user.displayName || user.email?.split('@')[0] || 'Usuário'
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      uid: user.uid,
      nome: nome,
      email: user.email,
      permissao: 'admin',
      status: 'ativo',
      userId: user.uid,
      criadoEm: new Date().toISOString()
    })

    return { id: docRef.id, uid: user.uid, nome, email: user.email, permissao: 'admin' }
  } catch (error) {
    console.error('Erro ao registrar ou buscar usuário:', error)
    throw error
  }
}

// ==========================================
// BUSCAR USUÁRIOS
// ==========================================
export const buscarUsuarios = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      orderBy('nome', 'asc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return []
  }
}

// ==========================================
// CONVIDAR USUÁRIO (COM ENVIO DE E-MAIL)
// ==========================================
export const convidarUsuario = async (email, senha, nome, permissao = 'visualizador') => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // 1. Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha)
    const novoUsuario = userCredential.user

    // 2. Salvar no Firestore
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      uid: novoUsuario.uid,
      nome: nome,
      email: email,
      permissao: permissao,
      status: 'ativo',
      criadoPor: user.uid,
      userId: user.uid,
      criadoEm: new Date().toISOString()
    })

    // 3. Enviar e-mail de boas-vindas com link para definir senha
    try {
      await sendPasswordResetEmail(auth, email, {
        url: 'https://finappgo-bugalho.vercel.app/login',
        handleCodeInApp: false
      })
      console.log(`📧 E-mail de convite enviado para ${email}`)
    } catch (emailError) {
      console.warn('⚠️ Não foi possível enviar e-mail de convite:', emailError)
      // Não falha o convite se o e-mail falhar
    }

    return { 
      id: docRef.id, 
      uid: novoUsuario.uid, 
      nome, 
      email, 
      permissao,
      senhaTemporaria: senha // Mostrar apenas uma vez
    }
  } catch (error) {
    console.error('Erro ao convidar usuário:', error)
    throw error
  }
}

// ==========================================
// ATUALIZAR USUÁRIO
// ==========================================
export const atualizarUsuario = async (id, dados) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...dados,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...dados }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    throw error
  }
}

// ==========================================
// EXCLUIR USUÁRIO
// ==========================================
export const excluirUsuario = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    throw error
  }
}

// ==========================================
// GERAR SENHA TEMPORÁRIA
// ==========================================
export const gerarSenhaTemporaria = () => {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const numeros = '0123456789'
  const especiais = '!@#$%^&*'
  const todos = letras + numeros + especiais
  
  let senha = ''
  for (let i = 0; i < 10; i++) {
    senha += todos.charAt(Math.floor(Math.random() * todos.length))
  }
  return senha
}