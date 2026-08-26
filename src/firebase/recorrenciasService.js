// src/firebase/recorrenciasService.js
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
import { adicionarLancamento } from './lancamentosService'

const COLLECTION_NAME = 'recorrencias'
const LOG_COLLECTION = 'recorrenciasLog'

// ==========================================
// RECORRÊNCIAS
// ==========================================

export const buscarRecorrencias = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      orderBy('proximoVencimento', 'asc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar recorrências:', error)
    return []
  }
}

export const adicionarRecorrencia = async (recorrencia) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const proximoVencimento = calcularProximoVencimento(
      recorrencia.dataInicio,
      recorrencia.periodicidade,
      recorrencia.diaVencimento
    )

    const status = verificarStatus(proximoVencimento, recorrencia.dataTermino)

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...recorrencia,
      userId: user.uid,
      proximoVencimento: proximoVencimento,
      status: status,
      criadoEm: new Date().toISOString()
    })

    return { id: docRef.id, ...recorrencia }
  } catch (error) {
    console.error('Erro ao adicionar recorrência:', error)
    throw error
  }
}

export const atualizarRecorrencia = async (id, recorrencia) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...recorrencia,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...recorrencia }
  } catch (error) {
    console.error('Erro ao atualizar recorrência:', error)
    throw error
  }
}

export const excluirRecorrencia = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir recorrência:', error)
    throw error
  }
}

// ==========================================
// GERAR LANÇAMENTOS
// ==========================================

export const gerarLancamentoRecorrente = async (recorrenciaId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const recorrenciaRef = doc(db, COLLECTION_NAME, recorrenciaId)
    const recorrenciaDoc = await getDoc(recorrenciaRef)
    if (!recorrenciaDoc.exists()) return

    const recorrencia = recorrenciaDoc.data()
    const hoje = new Date().toISOString().split('T')[0]
    
    if (recorrencia.dataTermino && recorrencia.dataTermino < hoje) {
      await updateDoc(recorrenciaRef, {
        status: 'concluida',
        atualizadoEm: new Date().toISOString()
      })
      return null
    }

    const lancamento = {
      data: hoje,
      descricao: `${recorrencia.nome} (Recorrente)`,
      categoria: recorrencia.categoria,
      subcategoria: recorrencia.subcategoria || '',
      tipo: 'despesa',
      valor: recorrencia.valor,
      contaId: recorrencia.contaId || '',
      recorrenciaId: recorrenciaId,
      geradoAutomaticamente: true,
      statusPagamento: 'pendente'
    }

    const resultado = await adicionarLancamento(lancamento)

    await addDoc(collection(db, LOG_COLLECTION), {
      recorrenciaId: recorrenciaId,
      lancamentoId: resultado.id,
      dataGeracao: hoje,
      userId: user.uid,
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    })

    const proximoVencimento = calcularProximoVencimento(
      recorrencia.dataInicio,
      recorrencia.periodicidade,
      recorrencia.diaVencimento,
      true
    )

    const novoStatus = verificarStatus(proximoVencimento, recorrencia.dataTermino)

    await updateDoc(recorrenciaRef, {
      proximoVencimento: proximoVencimento,
      ultimaGeracao: hoje,
      status: novoStatus,
      atualizadoEm: new Date().toISOString()
    })

    return resultado
  } catch (error) {
    console.error('Erro ao gerar lançamento recorrente:', error)
    throw error
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

export const calcularProximoVencimento = (dataInicio, periodicidade, diaVencimento, pular = false) => {
  const hoje = new Date()
  let data = dataInicio ? new Date(dataInicio) : new Date()
  
  if (!pular) {
    if (data > hoje) {
      return data.toISOString().split('T')[0]
    }
  }

  if (periodicidade === 'mensal') {
    data.setMonth(data.getMonth() + 1)
  } else if (periodicidade === 'semanal') {
    data.setDate(data.getDate() + 7)
  } else if (periodicidade === 'anual') {
    data.setFullYear(data.getFullYear() + 1)
  }

  if (diaVencimento) {
    const dia = parseInt(diaVencimento)
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate()
    data.setDate(Math.min(dia, ultimoDia))
  }

  return data.toISOString().split('T')[0]
}

export const verificarStatus = (proximoVencimento, dataTermino) => {
  const hoje = new Date().toISOString().split('T')[0]
  
  if (dataTermino && dataTermino < hoje) {
    return 'concluida'
  }
  
  if (dataTermino && proximoVencimento > dataTermino) {
    return 'concluida'
  }
  
  return 'ativo'
}

export const processarRecorrencias = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const hoje = new Date().toISOString().split('T')[0]

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', user.uid),
      where('status', '==', 'ativo'),
      where('proximoVencimento', '<=', hoje)
    )
    const querySnapshot = await getDocs(q)

    for (const doc of querySnapshot.docs) {
      const recorrencia = doc.data()
      
      const logQuery = query(
        collection(db, LOG_COLLECTION),
        where('recorrenciaId', '==', doc.id),
        where('mes', '==', new Date().getMonth() + 1),
        where('ano', '==', new Date().getFullYear())
      )
      const logSnapshot = await getDocs(logQuery)
      
      if (logSnapshot.empty) {
        await gerarLancamentoRecorrente(doc.id)
      }
    }
  } catch (error) {
    console.error('Erro ao processar recorrências:', error)
  }
}