// src/firebase/configuracoesService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  getDoc
} from 'firebase/firestore'
import { db, auth } from './firebase'

const COLLECTION_NAME = 'configuracoes'

// ==========================================
// BUSCAR CONFIGURAÇÕES
// ==========================================
export const buscarConfiguracoes = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      // Criar configurações padrão
      return await criarConfiguracoesPadrao()
    }

    let config = {}
    querySnapshot.forEach((doc) => {
      config = { id: doc.id, ...doc.data() }
    })
    return config
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return null
  }
}

// ==========================================
// CRIAR CONFIGURAÇÕES PADRÃO
// ==========================================
export const criarConfiguracoesPadrao = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const configPadrao = {
      userId: user.uid,
      tema: 'dark',
      moeda: 'R$',
      formatoData: 'DD/MM/YYYY',
      notificacoes: true,
      criadoEm: new Date().toISOString()
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), configPadrao)
    return { id: docRef.id, ...configPadrao }
  } catch (error) {
    console.error('Erro ao criar configurações padrão:', error)
    return null
  }
}

// ==========================================
// ATUALIZAR CONFIGURAÇÕES
// ==========================================
export const atualizarConfiguracoes = async (id, configuracoes) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...configuracoes,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...configuracoes }
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    throw error
  }
}