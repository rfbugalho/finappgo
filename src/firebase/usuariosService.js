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
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut 
} from 'firebase/auth'

const COLLECTION_NAME = 'usuarios'

// ==========================================
// REGISTRAR OU BUSCAR USUÁRIO
// ==========================================
export const registrarOuBuscarUsuario = async (user) => {
  try {
    if (!user) throw new Error('Usuário não informado')

    const q = query(
      collection(db, COLLECTION_NAME),
      where('uid', '==', user.uid)
    )
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      let usuario = {}
      querySnapshot.forEach((doc) => {
        usuario = { id: doc.id, ...doc.data() }
      })
      return usuario
    }

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
// CONVIDAR USUÁRIO (SEM LOGAR AUTOMATICAMENTE)
// ==========================================
export const convidarUsuario = async (email, nome, permissao = 'visualizador') => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // 1. Gerar senha temporária forte
    const senhaTemp = gerarSenhaTemporaria()

    // 2. Criar usuário no Auth (isso loga automaticamente, mas vamos deslogar depois)
    const userCredential = await createUserWithEmailAndPassword(auth, email, senhaTemp)
    const novoUsuario = userCredential.user

    // 3. Salvar no Firestore
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

    // 4. ⭐ ENVIAR E-MAIL DE REDEFINIÇÃO DE SENHA
    try {
      await sendPasswordResetEmail(auth, email, {
        url: 'https://finappgo-bugalho.vercel.app/login',
        handleCodeInApp: false
      })
      console.log(`📧 E-mail de convite enviado para ${email}`)
    } catch (emailError) {
      console.warn('⚠️ Erro ao enviar e-mail:', emailError)
    }

    // 5. ⭐ DESLOGAR O USUÁRIO CRIADO E VOLTAR AO USUÁRIO ORIGINAL
    try {
      await signOut(auth) // Desloga o usuário criado
      await user.reload() // Recarrega o usuário original
    } catch (signOutError) {
      console.warn('⚠️ Erro ao deslogar usuário:', signOutError)
    }

    return { 
      id: docRef.id, 
      uid: novoUsuario.uid, 
      nome, 
      email, 
      permissao,
      senhaTemporaria: senhaTemp
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

// ==========================================
// REENVIAR CONVITE
// ==========================================
export const reenviarConvite = async (email) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    await sendPasswordResetEmail(auth, email, {
      url: 'https://finappgo-bugalho.vercel.app/login',
      handleCodeInApp: false
    })
    return true
  } catch (error) {
    console.error('Erro ao reenviar convite:', error)
    throw error
  }
}