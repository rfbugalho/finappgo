// src/firebase/contasService.js
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

const COLLECTION_NAME = 'contas'

// Buscar todas as contas do usuário
export const buscarContas = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      orderBy('instituicao', 'asc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar contas:', error)
    return []
  }
}

// Buscar contas ativas
export const buscarContasAtivas = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      where('status', '==', 'ativo')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar contas ativas:', error)
    return []
  }
}

// Adicionar uma nova conta
export const adicionarConta = async (conta) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...conta,
      userId: user.uid,
      saldoAtual: conta.saldoInicial || 0,
      status: 'ativo',
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...conta }
  } catch (error) {
    console.error('Erro ao adicionar conta:', error)
    throw error
  }
}

// Atualizar uma conta
export const atualizarConta = async (id, conta) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...conta,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...conta }
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)
    throw error
  }
}

// Atualizar saldo de uma conta
export const atualizarSaldoConta = async (id, novoSaldo) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      saldoAtual: novoSaldo,
      atualizadoEm: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error)
    throw error
  }
}

// Excluir uma conta
export const excluirConta = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    throw error
  }
}
// ==========================================
// TRANSFERÊNCIA ENTRE CONTAS
// ==========================================

export const transferirEntreContas = async (contaOrigemId, contaDestinoId, valor, descricao = '') => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const valorNumero = parseFloat(valor)
    if (isNaN(valorNumero) || valorNumero <= 0) {
      throw new Error('Valor inválido')
    }

    if (contaOrigemId === contaDestinoId) {
      throw new Error('Não é possível transferir para a mesma conta')
    }

    // Buscar contas
    const origemRef = doc(db, COLLECTION_NAME, contaOrigemId)
    const destinoRef = doc(db, COLLECTION_NAME, contaDestinoId)
    
    const origemDoc = await getDoc(origemRef)
    const destinoDoc = await getDoc(destinoRef)
    
    if (!origemDoc.exists() || !destinoDoc.exists()) {
      throw new Error('Conta não encontrada')
    }

    const origemData = origemDoc.data()
    const destinoData = destinoDoc.data()

    // Verificar saldo disponível
    if ((origemData.saldoAtual || 0) < valorNumero) {
      throw new Error('Saldo insuficiente na conta de origem')
    }

    // Atualizar saldos
    const novoSaldoOrigem = (origemData.saldoAtual || 0) - valorNumero
    const novoSaldoDestino = (destinoData.saldoAtual || 0) + valorNumero

    await updateDoc(origemRef, {
      saldoAtual: novoSaldoOrigem,
      atualizadoEm: new Date().toISOString()
    })

    await updateDoc(destinoRef, {
      saldoAtual: novoSaldoDestino,
      atualizadoEm: new Date().toISOString()
    })

    // Registrar transferência (opcional - criar no Firestore)
    const transferencia = {
      contaOrigemId: contaOrigemId,
      contaDestinoId: contaDestinoId,
      valor: valorNumero,
      descricao: descricao || 'Transferência entre contas',
      userId: user.uid,
      data: new Date().toISOString().split('T')[0],
      criadoEm: new Date().toISOString()
    }

    // Salvar no histórico (opcional)
    await addDoc(collection(db, 'transferencias'), transferencia)

    return {
      origem: { id: contaOrigemId, saldoAtual: novoSaldoOrigem },
      destino: { id: contaDestinoId, saldoAtual: novoSaldoDestino }
    }
  } catch (error) {
    console.error('Erro ao transferir:', error)
    throw error
  }
}