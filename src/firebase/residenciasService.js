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

const RESIDENCIAS_COLLECTION = 'residencias'
const DESPESAS_RESIDENCIA_COLLECTION = 'despesasResidencia'

// ==========================================
// RESIDÊNCIAS
// ==========================================

export const buscarResidencias = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, RESIDENCIAS_COLLECTION), 
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
    console.error('Erro ao buscar residências:', error)
    return []
  }
}

export const adicionarResidencia = async (residencia) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, RESIDENCIAS_COLLECTION), {
      ...residencia,
      userId: user.uid,
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...residencia }
  } catch (error) {
    console.error('Erro ao adicionar residência:', error)
    throw error
  }
}

export const atualizarResidencia = async (id, residencia) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, RESIDENCIAS_COLLECTION, id)
    await updateDoc(docRef, {
      ...residencia,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...residencia }
  } catch (error) {
    console.error('Erro ao atualizar residência:', error)
    throw error
  }
}

export const excluirResidencia = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, RESIDENCIAS_COLLECTION, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir residência:', error)
    throw error
  }
}

// ==========================================
// DESPESAS DA RESIDÊNCIA
// ==========================================

export const buscarDespesasResidencia = async (residenciaId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, DESPESAS_RESIDENCIA_COLLECTION), 
      where('userId', '==', user.uid),
      where('residenciaId', '==', residenciaId),
      orderBy('data', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar despesas da residência:', error)
    return []
  }
}

export const adicionarDespesaResidencia = async (despesa) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, DESPESAS_RESIDENCIA_COLLECTION), {
      ...despesa,
      userId: user.uid,
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...despesa }
  } catch (error) {
    console.error('Erro ao adicionar despesa da residência:', error)
    throw error
  }
}

export const atualizarDespesaResidencia = async (id, despesa) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, DESPESAS_RESIDENCIA_COLLECTION, id)
    await updateDoc(docRef, {
      ...despesa,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...despesa }
  } catch (error) {
    console.error('Erro ao atualizar despesa da residência:', error)
    throw error
  }
}

export const excluirDespesaResidencia = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, DESPESAS_RESIDENCIA_COLLECTION, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir despesa da residência:', error)
    throw error
  }
}