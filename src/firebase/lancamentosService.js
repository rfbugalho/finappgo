// src/firebase/lancamentosService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  where,
  getDoc
} from 'firebase/firestore'
import { db, auth } from './firebase'

const COLLECTION_NAME = 'lancamentos'

// ==========================================
// BUSCAR LANÇAMENTOS
// ==========================================
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

// ==========================================
// BUSCAR LANÇAMENTOS POR CATEGORIA
// ==========================================
export const buscarLancamentosPorCategoria = async (categoria) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      where('categoria', '==', categoria)
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar lançamentos por categoria:', error)
    return []
  }
}

// ==========================================
// BUSCAR LANÇAMENTOS POR SUBCATEGORIA
// ==========================================
export const buscarLancamentosPorSubcategoria = async (subcategoria) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      where('subcategoria', '==', subcategoria)
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar lançamentos por subcategoria:', error)
    return []
  }
}

// ==========================================
// BUSCAR LANÇAMENTOS POR CONTA
// ==========================================
export const buscarLancamentosPorConta = async (contaId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      where('contaId', '==', contaId),
      orderBy('data', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar lançamentos por conta:', error)
    return []
  }
}

// ==========================================
// BUSCAR LANÇAMENTOS POR PERÍODO
// ==========================================
export const buscarLancamentosPorPeriodo = async (mes, ano) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const mesStr = String(mes).padStart(2, '0')
    const anoStr = String(ano)
    const dataInicio = `${anoStr}-${mesStr}-01`
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const dataFim = `${anoStr}-${mesStr}-${String(ultimoDia).padStart(2, '0')}`

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      where('data', '>=', dataInicio),
      where('data', '<=', dataFim),
      orderBy('data', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar lançamentos por período:', error)
    return []
  }
}

// ==========================================
// ADICIONAR LANÇAMENTO (com atualização de saldo)
// ==========================================
export const adicionarLancamento = async (lancamento) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const valorNumero = parseFloat(lancamento.valor)
    
    // Salvar o lançamento
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...lancamento,
      valor: valorNumero,
      userId: user.uid,
      criadoEm: new Date().toISOString()
    })

    // Se tiver conta associada, atualizar o saldo
    if (lancamento.contaId) {
      await atualizarSaldoContaPorLancamento(
        lancamento.contaId, 
        valorNumero, 
        lancamento.tipo
      )
    }

    return { id: docRef.id, ...lancamento }
  } catch (error) {
    console.error('Erro ao adicionar lançamento:', error)
    throw error
  }
}

// ==========================================
// ATUALIZAR LANÇAMENTO
// ==========================================
export const atualizarLancamento = async (id, lancamento) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Buscar o lançamento antigo para ajustar o saldo
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    const dadosAntigos = docSnap.data()

    const valorNumero = parseFloat(lancamento.valor)

    // Atualizar o lançamento
    await updateDoc(docRef, {
      ...lancamento,
      valor: valorNumero,
      atualizadoEm: new Date().toISOString()
    })

    // Se tiver conta associada, ajustar o saldo
    if (lancamento.contaId) {
      // Reverter saldo antigo
      if (dadosAntigos.contaId) {
        await atualizarSaldoContaPorLancamento(
          dadosAntigos.contaId,
          dadosAntigos.valor,
          dadosAntigos.tipo === 'receita' ? 'despesa' : 'receita' // Reverter
        )
      }
      
      // Aplicar novo saldo
      await atualizarSaldoContaPorLancamento(
        lancamento.contaId,
        valorNumero,
        lancamento.tipo
      )
    }

    return { id, ...lancamento }
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error)
    throw error
  }
}

// ==========================================
// EXCLUIR LANÇAMENTO (com ajuste de saldo)
// ==========================================
export const excluirLancamento = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Buscar o lançamento para saber qual conta e valor
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    const dados = docSnap.data()

    // Se tiver conta associada, reverter o saldo
    if (dados?.contaId) {
      await atualizarSaldoContaPorLancamento(
        dados.contaId,
        dados.valor,
        dados.tipo === 'receita' ? 'despesa' : 'receita' // Reverter
      )
    }

    // Excluir o lançamento
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error)
    throw error
  }
}

// ==========================================
// ATUALIZAR SALDO DA CONTA
// ==========================================
export const atualizarSaldoContaPorLancamento = async (contaId, valor, tipo) => {
  try {
    if (!contaId) return

    const contaRef = doc(db, 'contas', contaId)
    const contaDoc = await getDoc(contaRef)
    
    if (!contaDoc.exists()) {
      console.warn('Conta não encontrada:', contaId)
      return
    }

    const contaData = contaDoc.data()
    const saldoAtual = contaData.saldoAtual || 0
    
    // Se for receita, soma; se for despesa, subtrai
    const novoSaldo = tipo === 'receita' 
      ? saldoAtual + valor 
      : saldoAtual - valor

    await updateDoc(contaRef, {
      saldoAtual: novoSaldo,
      atualizadoEm: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao atualizar saldo da conta:', error)
    throw error
  }
}

// ==========================================
// CALCULAR SALDO TOTAL DAS CONTAS
// ==========================================
export const calcularSaldoTotalContas = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, 'contas'), 
      where('userId', '==', user.uid)
    )
    const querySnapshot = await getDocs(q)
    let total = 0
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      total += data.saldoAtual || 0
    })
    return total
  } catch (error) {
    console.error('Erro ao calcular saldo total:', error)
    return 0
  }
}