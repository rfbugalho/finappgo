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

const VEICULOS_COLLECTION = 'veiculos'
const ABASTECIMENTOS_COLLECTION = 'abastecimentos'
const MANUTENCOES_COLLECTION = 'manutencoes'

// ==========================================
// VEÍCULOS
// ==========================================

export const buscarVeiculos = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, VEICULOS_COLLECTION), 
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
    console.error('Erro ao buscar veículos:', error)
    return []
  }
}

export const adicionarVeiculo = async (veiculo) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, VEICULOS_COLLECTION), {
      ...veiculo,
      userId: user.uid,
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...veiculo }
  } catch (error) {
    console.error('Erro ao adicionar veículo:', error)
    throw error
  }
}

export const atualizarVeiculo = async (id, veiculo) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, VEICULOS_COLLECTION, id)
    await updateDoc(docRef, {
      ...veiculo,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...veiculo }
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error)
    throw error
  }
}

export const excluirVeiculo = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, VEICULOS_COLLECTION, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir veículo:', error)
    throw error
  }
}

// ==========================================
// ABASTECIMENTOS
// ==========================================

export const buscarAbastecimentos = async (veiculoId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, ABASTECIMENTOS_COLLECTION), 
      where('userId', '==', user.uid),
      where('veiculoId', '==', veiculoId),
      orderBy('data', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar abastecimentos:', error)
    return []
  }
}

export const adicionarAbastecimento = async (abastecimento) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Calcular KM rodados e KM/L
    const kmRodados = abastecimento.kmFinal - abastecimento.kmInicial
    const kmPorLitro = abastecimento.litros > 0 ? kmRodados / abastecimento.litros : 0

    const docRef = await addDoc(collection(db, ABASTECIMENTOS_COLLECTION), {
      ...abastecimento,
      userId: user.uid,
      kmRodados: parseFloat(kmRodados.toFixed(2)),
      kmPorLitro: parseFloat(kmPorLitro.toFixed(2)),
      criadoEm: new Date().toISOString()
    })

    // Atualizar KM atual do veículo
    await atualizarKmVeiculo(abastecimento.veiculoId, abastecimento.kmFinal)

    return { id: docRef.id, ...abastecimento }
  } catch (error) {
    console.error('Erro ao adicionar abastecimento:', error)
    throw error
  }
}

export const atualizarAbastecimento = async (id, abastecimento) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const kmRodados = abastecimento.kmFinal - abastecimento.kmInicial
    const kmPorLitro = abastecimento.litros > 0 ? kmRodados / abastecimento.litros : 0

    const docRef = doc(db, ABASTECIMENTOS_COLLECTION, id)
    await updateDoc(docRef, {
      ...abastecimento,
      kmRodados: parseFloat(kmRodados.toFixed(2)),
      kmPorLitro: parseFloat(kmPorLitro.toFixed(2)),
      atualizadoEm: new Date().toISOString()
    })

    // Atualizar KM atual do veículo (buscar o último abastecimento)
    await atualizarKmVeiculo(abastecimento.veiculoId)

    return { id, ...abastecimento }
  } catch (error) {
    console.error('Erro ao atualizar abastecimento:', error)
    throw error
  }
}

export const excluirAbastecimento = async (id, veiculoId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, ABASTECIMENTOS_COLLECTION, id)
    await deleteDoc(docRef)

    // Atualizar KM atual do veículo
    await atualizarKmVeiculo(veiculoId)

    return id
  } catch (error) {
    console.error('Erro ao excluir abastecimento:', error)
    throw error
  }
}

// ==========================================
// MANUTENÇÕES
// ==========================================

export const buscarManutencoes = async (veiculoId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, MANUTENCOES_COLLECTION), 
      where('userId', '==', user.uid),
      where('veiculoId', '==', veiculoId),
      orderBy('data', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar manutenções:', error)
    return []
  }
}

export const adicionarManutencao = async (manutencao) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, MANUTENCOES_COLLECTION), {
      ...manutencao,
      userId: user.uid,
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...manutencao }
  } catch (error) {
    console.error('Erro ao adicionar manutenção:', error)
    throw error
  }
}

export const atualizarManutencao = async (id, manutencao) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, MANUTENCOES_COLLECTION, id)
    await updateDoc(docRef, {
      ...manutencao,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...manutencao }
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error)
    throw error
  }
}

export const excluirManutencao = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, MANUTENCOES_COLLECTION, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir manutenção:', error)
    throw error
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

export const atualizarKmVeiculo = async (veiculoId, kmAtual = null) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const veiculoRef = doc(db, VEICULOS_COLLECTION, veiculoId)
    
    if (kmAtual !== null) {
      // Atualizar com o KM fornecido
      await updateDoc(veiculoRef, {
        kmAtual: kmAtual,
        atualizadoEm: new Date().toISOString()
      })
    } else {
      // Buscar o último abastecimento para obter o KM
      const q = query(
        collection(db, ABASTECIMENTOS_COLLECTION),
        where('userId', '==', user.uid),
        where('veiculoId', '==', veiculoId),
        orderBy('data', 'desc'),
        orderBy('kmFinal', 'desc')
      )
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const ultimo = querySnapshot.docs[0].data()
        await updateDoc(veiculoRef, {
          kmAtual: ultimo.kmFinal,
          atualizadoEm: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar KM do veículo:', error)
  }
}