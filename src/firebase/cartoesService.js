// src/firebase/cartoesService.js
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

const COLLECTION_NAME = 'cartoes'
const DESPESAS_COLLECTION = 'despesasCartao'

// ==========================================
// CARTÕES
// ==========================================

// Buscar todos os cartões do usuário
export const buscarCartoes = async () => {
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
    console.error('Erro ao buscar cartões:', error)
    return []
  }
}

// Adicionar um novo cartão
export const adicionarCartao = async (cartao) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...cartao,
      userId: user.uid,
      limiteDisponivel: cartao.limiteTotal || 0,
      status: 'ativo',
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...cartao }
  } catch (error) {
    console.error('Erro ao adicionar cartão:', error)
    throw error
  }
}

// Atualizar um cartão
export const atualizarCartao = async (id, cartao) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...cartao,
      atualizadoEm: new Date().toISOString()
    })
    return { id, ...cartao }
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error)
    throw error
  }
}

// Excluir um cartão
export const excluirCartao = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir cartão:', error)
    throw error
  }
}

// ==========================================
// DESPESAS DO CARTÃO
// ==========================================

// Buscar despesas de um cartão
export const buscarDespesasCartao = async (cartaoId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, DESPESAS_COLLECTION), 
      where('userId', '==', user.uid),
      where('cartaoId', '==', cartaoId),
      orderBy('data', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar despesas do cartão:', error)
    return []
  }
}

// Adicionar despesa no cartão
export const adicionarDespesaCartao = async (despesa) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Calcular o valor da parcela se for parcelado
    let valorParcela = despesa.valor
    let totalParcelas = 1
    let parcelaAtual = 1

    if (despesa.parcelado && despesa.totalParcelas > 1) {
      totalParcelas = despesa.totalParcelas
      valorParcela = despesa.valor / totalParcelas
    }

    const docRef = await addDoc(collection(db, DESPESAS_COLLECTION), {
      ...despesa,
      userId: user.uid,
      valorParcela: parseFloat(valorParcela.toFixed(2)),
      totalParcelas: totalParcelas,
      parcelaAtual: parcelaAtual,
      parcelasRestantes: totalParcelas - parcelaAtual,
      criadoEm: new Date().toISOString()
    })

    // Atualizar o limite disponível do cartão
    await atualizarLimiteCartao(despesa.cartaoId)

    return { id: docRef.id, ...despesa }
  } catch (error) {
    console.error('Erro ao adicionar despesa no cartão:', error)
    throw error
  }
}

// Atualizar despesa do cartão
export const atualizarDespesaCartao = async (id, despesa) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, DESPESAS_COLLECTION, id)
    await updateDoc(docRef, {
      ...despesa,
      atualizadoEm: new Date().toISOString()
    })

    // Atualizar o limite disponível do cartão
    await atualizarLimiteCartao(despesa.cartaoId)

    return { id, ...despesa }
  } catch (error) {
    console.error('Erro ao atualizar despesa do cartão:', error)
    throw error
  }
}

// Excluir despesa do cartão
export const excluirDespesaCartao = async (id, cartaoId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, DESPESAS_COLLECTION, id)
    await deleteDoc(docRef)

    // Atualizar o limite disponível do cartão
    if (cartaoId) {
      await atualizarLimiteCartao(cartaoId)
    }

    return id
  } catch (error) {
    console.error('Erro ao excluir despesa do cartão:', error)
    throw error
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

// Atualizar limite disponível do cartão
export const atualizarLimiteCartao = async (cartaoId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Buscar o cartão
    const cartaoRef = doc(db, COLLECTION_NAME, cartaoId)
    const cartaoDoc = await getDoc(cartaoRef)
    if (!cartaoDoc.exists()) return

    const cartao = cartaoDoc.data()
    
    // Buscar todas as despesas do cartão
    const q = query(
      collection(db, DESPESAS_COLLECTION),
      where('userId', '==', user.uid),
      where('cartaoId', '==', cartaoId)
    )
    const querySnapshot = await getDocs(q)
    
    let totalGasto = 0
    querySnapshot.forEach((doc) => {
      const despesa = doc.data()
      // Só considerar despesas com parcelas restantes ou parcelas atuais
      if (despesa.parcelasRestantes !== undefined) {
        // Se for parcelado, considerar apenas o valor restante
        totalGasto += despesa.valorParcela * (despesa.totalParcelas - (despesa.parcelaAtual - 1))
      } else {
        totalGasto += despesa.valor
      }
    })

    const limiteDisponivel = cartao.limiteTotal - totalGasto

    await updateDoc(cartaoRef, {
      limiteDisponivel: parseFloat(limiteDisponivel.toFixed(2)),
      totalGasto: parseFloat(totalGasto.toFixed(2)),
      atualizadoEm: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao atualizar limite do cartão:', error)
  }
}

// Processar parcelas mensais (rodar diariamente)
export const processarParcelas = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    const q = query(
      collection(db, DESPESAS_COLLECTION),
      where('userId', '==', user.uid),
      where('parcelado', '==', true)
    )
    const querySnapshot = await getDocs(q)
    
    for (const doc of querySnapshot.docs) {
      const despesa = doc.data()
      const dataDespesa = new Date(despesa.data)
      
      // Verificar se a despesa já foi paga (parcelas restantes > 0)
      if (despesa.parcelasRestantes > 0) {
        // Verificar se já passou um mês da data da despesa
        const diffMeses = (anoAtual - dataDespesa.getFullYear()) * 12 + (mesAtual - dataDespesa.getMonth())
        
        if (diffMeses > 0 && despesa.parcelaAtual < despesa.totalParcelas) {
          // Avançar para a próxima parcela
          const novaParcelaAtual = despesa.parcelaAtual + 1
          const novasParcelasRestantes = despesa.totalParcelas - novaParcelaAtual
          
          await updateDoc(doc.ref, {
            parcelaAtual: novaParcelaAtual,
            parcelasRestantes: novasParcelasRestantes,
            atualizadoEm: new Date().toISOString()
          })
        }
      }
    }

    // Recalcular limites de todos os cartões
    const cartoes = await buscarCartoes()
    for (const cartao of cartoes) {
      await atualizarLimiteCartao(cartao.id)
    }

  } catch (error) {
    console.error('Erro ao processar parcelas:', error)
  }
}