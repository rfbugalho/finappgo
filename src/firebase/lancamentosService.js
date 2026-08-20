import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  where
} from 'firebase/firestore'
import { db, auth } from './firebase'

const COLLECTION_NAME = 'lancamentos'

// Buscar lançamentos do usuário logado
export const buscarLancamentos = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      orderBy('data', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error)
    return []
  }
}

// Adicionar lançamento com userId
export const adicionarLancamento = async (lancamento) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...lancamento,
      userId: user.uid,
      valor: parseFloat(lancamento.valor),
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...lancamento }
  } catch (error) {
    console.error('Erro ao adicionar lançamento:', error)
    throw error
  }
}

// Atualizar lançamento (verifica se é do usuário)
export const atualizarLancamento = async (id, lancamento) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...lancamento,
      valor: parseFloat(lancamento.valor),
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...lancamento }
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error)
    throw error
  }
}

// Excluir lançamento
export const excluirLancamento = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error)
    throw error
  }
}