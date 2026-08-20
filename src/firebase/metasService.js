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
  getDoc
} from 'firebase/firestore'
import { db, auth } from './firebase'

const COLLECTION_NAME = 'metas'

export const buscarMetas = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      orderBy('prazo', 'asc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar metas:', error)
    return []
  }
}

export const adicionarMeta = async (meta) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...meta,
      userId: user.uid,
      progresso: 0,
      status: 'em_andamento',
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...meta }
  } catch (error) {
    console.error('Erro ao adicionar meta:', error)
    throw error
  }
}

export const atualizarMeta = async (id, meta) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...meta,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...meta }
  } catch (error) {
    console.error('Erro ao atualizar meta:', error)
    throw error
  }
}

export const excluirMeta = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir meta:', error)
    throw error
  }
}

export const atualizarProgressoMeta = async (id, valorAtual) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return

    const meta = docSnap.data()
    const progresso = Math.min((valorAtual / meta.valorAlvo) * 100, 100)
    
    let status = 'em_andamento'
    if (progresso >= 100) {
      status = 'concluida'
    } else {
      const hoje = new Date()
      const prazo = new Date(meta.prazo)
      if (prazo < hoje) {
        status = 'atrasada'
      }
    }

    await updateDoc(docRef, {
      progresso: parseFloat(progresso.toFixed(2)),
      valorAtual: parseFloat(valorAtual.toFixed(2)),
      status: status,
      atualizadoEm: new Date().toISOString()
    })

    return { ...meta, progresso, status }
  } catch (error) {
    console.error('Erro ao atualizar progresso da meta:', error)
    throw error
  }
}