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
import { createUserWithEmailAndPassword } from 'firebase/auth'

const COLLECTION_NAME = 'usuarios'

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

export const convidarUsuario = async (email, senha, nome, permissao = 'visualizador') => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const userCredential = await createUserWithEmailAndPassword(auth, email, senha)
    const novoUsuario = userCredential.user

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

    return { id: docRef.id, uid: novoUsuario.uid, nome, email, permissao }
  } catch (error) {
    console.error('Erro ao convidar usuário:', error)
    throw error
  }
}

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