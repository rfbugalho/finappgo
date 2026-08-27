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
const PAGAMENTOS_COLLECTION = 'pagamentosCartao'

// ==========================================
// CARTÕES
// ==========================================

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

export const adicionarCartao = async (cartao) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...cartao,
      userId: user.uid,
      totalGasto: 0,
      totalFatura: 0,
      statusFatura: 'aberta',
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...cartao }
  } catch (error) {
    console.error('Erro ao adicionar cartão:', error)
    throw error
  }
}

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

export const buscarDespesasCartao = async (cartaoId, mes = null, ano = null) => {
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
      const data = doc.data()
      if (mes && ano) {
        const dataObj = new Date(data.data)
        if (dataObj.getMonth() + 1 === mes && dataObj.getFullYear() === ano) {
          lista.push({ id: doc.id, ...data })
        }
      } else {
        lista.push({ id: doc.id, ...data })
      }
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar despesas do cartão:', error)
    return []
  }
}

export const adicionarDespesaCartao = async (despesa) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Se for pagamento de fatura
    if (despesa.pagamentoFatura) {
      return await registrarPagamentoFatura(despesa)
    }

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
      mesFatura: despesa.mesFatura || new Date(despesa.data).getMonth() + 1,
      anoFatura: despesa.anoFatura || new Date(despesa.data).getFullYear(),
      status: 'pendente',
      criadoEm: new Date().toISOString()
    })

    await atualizarLimiteCartao(despesa.cartaoId)

    return { id: docRef.id, ...despesa }
  } catch (error) {
    console.error('Erro ao adicionar despesa no cartão:', error)
    throw error
  }
}

// ==========================================
// PAGAMENTO DE FATURA
// ==========================================

export const registrarPagamentoFatura = async (pagamento) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    // Buscar o cartão
    const cartaoRef = doc(db, COLLECTION_NAME, pagamento.cartaoId)
    const cartaoDoc = await getDoc(cartaoRef)
    if (!cartaoDoc.exists()) {
      throw new Error('Cartão não encontrado')
    }

    const cartao = cartaoDoc.data()
    const valorPago = parseFloat(pagamento.valor)
    const dataPagamento = pagamento.data || new Date().toISOString().split('T')[0]
    const dataVencimento = pagamento.dataVencimento || dataPagamento

    // Verificar se pagou após o vencimento
    const vencido = dataPagamento > dataVencimento
    let juros = 0
    let multa = 0

    if (vencido) {
      // Calcular juros (exemplo: 2% de multa + 0.033% ao dia)
      const diasAtraso = Math.ceil((new Date(dataPagamento) - new Date(dataVencimento)) / (1000 * 60 * 60 * 24))
      multa = valorPago * 0.02 // 2% de multa
      juros = valorPago * (0.00033 * diasAtraso) // 0.033% ao dia
    }

    // Registrar pagamento
    const docRef = await addDoc(collection(db, PAGAMENTOS_COLLECTION), {
      cartaoId: pagamento.cartaoId,
      valor: valorPago,
      dataPagamento: dataPagamento,
      dataVencimento: dataVencimento,
      juros: parseFloat(juros.toFixed(2)),
      multa: parseFloat(multa.toFixed(2)),
      totalPago: parseFloat((valorPago + juros + multa).toFixed(2)),
      vencido: vencido,
      descricao: pagamento.descricao || 'Pagamento de fatura',
      userId: user.uid,
      criadoEm: new Date().toISOString()
    })

    // Atualizar limite do cartão (liberar o valor pago)
    await atualizarLimiteCartao(pagamento.cartaoId)

    // Registrar também como lançamento (para aparecer na tela de lançamentos)
    const lancamento = {
      data: dataPagamento,
      descricao: `${vencido ? '🔴 PAGAMENTO FATURA (VENCIDO)' : '✅ PAGAMENTO FATURA'} - ${cartao.nome}`,
      categoria: 'Pagamento Fatura',
      subcategoria: cartao.nome,
      tipo: 'despesa',
      valor: valorPago + juros + multa,
      contaId: pagamento.contaId || '',
      cartaoId: pagamento.cartaoId,
      pagamentoFatura: true,
      statusPagamento: 'pago'
    }

    const { adicionarLancamento } = await import('./lancamentosService')
    await adicionarLancamento(lancamento)

    return {
      id: docRef.id,
      pagamento: {
        valor: valorPago,
        juros: juros,
        multa: multa,
        total: valorPago + juros + multa,
        vencido: vencido
      }
    }
  } catch (error) {
    console.error('Erro ao registrar pagamento de fatura:', error)
    throw error
  }
}

export const buscarPagamentosCartao = async (cartaoId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, PAGAMENTOS_COLLECTION), 
      where('userId', '==', user.uid),
      where('cartaoId', '==', cartaoId),
      orderBy('dataPagamento', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar pagamentos do cartão:', error)
    return []
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

export const atualizarLimiteCartao = async (cartaoId) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

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
    let totalFatura = 0
    let statusFatura = 'aberta'

    querySnapshot.forEach((doc) => {
      const despesa = doc.data()
      // Se for compra parcelada, considerar apenas o valor total da compra
      if (despesa.parcelado) {
        totalGasto += despesa.valor // Valor total da compra
        totalFatura += despesa.valorParcela // Valor da parcela atual
      } else {
        totalGasto += despesa.valor
        totalFatura += despesa.valor
      }
    })

    // Buscar pagamentos realizados
    const qPagamentos = query(
      collection(db, PAGAMENTOS_COLLECTION),
      where('userId', '==', user.uid),
      where('cartaoId', '==', cartaoId)
    )
    const pagamentosSnapshot = await getDocs(qPagamentos)
    let totalPago = 0
    pagamentosSnapshot.forEach((doc) => {
      totalPago += doc.data().totalPago || doc.data().valor || 0
    })

    // Ajustar total gasto considerando pagamentos
    const totalEfetivo = totalGasto - totalPago
    const limiteDisponivel = cartao.limiteTotal - totalEfetivo

    // Atualizar status da fatura
    if (totalEfetivo <= 0) {
      statusFatura = 'paga'
    } else if (totalFatura > 0) {
      statusFatura = 'aberta'
    }

    await updateDoc(cartaoRef, {
      limiteDisponivel: parseFloat(limiteDisponivel.toFixed(2)),
      totalGasto: parseFloat(totalEfetivo.toFixed(2)),
      totalFatura: parseFloat(totalFatura.toFixed(2)),
      statusFatura: statusFatura,
      totalPago: parseFloat(totalPago.toFixed(2)),
      atualizadoEm: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao atualizar limite do cartão:', error)
  }
}