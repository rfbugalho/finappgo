// src/firebase/categoriasService.js
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

const COLLECTION_NAME = 'categorias'

// Buscar todas as categorias do usuário
export const buscarCategorias = async () => {
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
    console.error('Erro ao buscar categorias:', error)
    return []
  }
}

// Adicionar uma nova categoria
export const adicionarCategoria = async (categoria) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...categoria,
      userId: user.uid,
      subcategorias: categoria.subcategorias || [],
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...categoria }
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error)
    throw error
  }
}

// Atualizar uma categoria
export const atualizarCategoria = async (id, categoria) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...categoria,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...categoria }
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    throw error
  }
}

// Excluir uma categoria
export const excluirCategoria = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    throw error
  }
}