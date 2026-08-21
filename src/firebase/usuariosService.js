import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  getDoc,
  setDoc
} from 'firebase/firestore'
import { 
  db, 
  auth 
} from './firebase'
import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth'

const COLLECTION_NAME = 'usuarios'

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
// CONVIDAR USUÁRIO (criar no Firebase Auth)
// ==========================================

export const convidarUsuario = async (email, senha, nome, permissao = 'visualizador') => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha)
    const novoUsuario = userCredential.user

    // Salvar dados do usuário no Firestore
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      uid: novoUsuario.uid,
      nome: nome,
      email: email,
      permissao: permissao,
      status: 'ativo',
      criadoPor: user.uid,
      criadoEm: new Date().toISOString()
    })

    // Enviar e-mail de boas-vidas (opcional)
    // await sendPasswordResetEmail(auth, email)

    return { id: docRef.id, uid: novoUsuario.uid, nome, email, permissao }
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

export const excluirUsuario = async (id, uid) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Excluir do Firestore
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)

    // Excluir do Firebase Auth (requer funções administrativas)
    // Nota: Para excluir usuários do Auth, você precisa usar Admin SDK
    // ou o usuário pode excluir sua própria conta

    return id
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    throw error
  }
}

// ==========================================
// VERIFICAR PERMISSÃO
// ==========================================

export const verificarPermissao = async (usuarioId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME),
      where('uid', '==', user.uid)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return 'admin' // Se não encontrado, é o próprio admin
    }

    const usuario = querySnapshot.docs[0].data()
    return usuario.permissao || 'visualizador'
  } catch (error) {
    console.error('Erro ao verificar permissão:', error)
    return 'visualizador'
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