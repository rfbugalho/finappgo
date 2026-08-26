// src/firebase/notificacoesService.js
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

const COLLECTION_NAME = 'notificacoes'

// ==========================================
// BUSCAR NOTIFICAÇÕES
// ==========================================

export const buscarNotificacoes = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      orderBy('criadoEm', 'desc')
    )
    const querySnapshot = await getDocs(q)
    const lista = []
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    return lista
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return []
  }
}

// ==========================================
// CRIAR NOTIFICAÇÃO
// ==========================================

export const criarNotificacao = async (notificacao) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...notificacao,
      userId: user.uid,
      lido: false,
      criadoEm: new Date().toISOString()
    })
    return { id: docRef.id, ...notificacao }
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    throw error
  }
}

// ==========================================
// MARCAR NOTIFICAÇÃO COMO LIDA
// ==========================================

export const marcarComoLido = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      lido: true,
      lidoEm: new Date().toISOString()
    })
    return id
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    throw error
  }
}

// ==========================================
// MARCAR TODAS COMO LIDAS
// ==========================================

export const marcarTodasComoLidas = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      where('lido', '==', false)
    )
    const querySnapshot = await getDocs(q)
    
    for (const doc of querySnapshot.docs) {
      await updateDoc(doc.ref, {
        lido: true,
        lidoEm: new Date().toISOString()
      })
    }
    
    return true
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error)
    throw error
  }
}

// ==========================================
// EXCLUIR NOTIFICAÇÃO
// ==========================================

export const excluirNotificacao = async (id) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    return id
  } catch (error) {
    console.error('Erro ao excluir notificação:', error)
    throw error
  }
}

// ==========================================
// EXCLUIR TODAS AS NOTIFICAÇÕES LIDAS
// ==========================================

export const excluirNotificacoesLidas = async () => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const q = query(
      collection(db, COLLECTION_NAME), 
      where('userId', '==', user.uid),
      where('lido', '==', true)
    )
    const querySnapshot = await getDocs(q)
    
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref)
    }
    
    return true
  } catch (error) {
    console.error('Erro ao excluir notificações lidas:', error)
    throw error
  }
}

// ==========================================
// GERAR NOTIFICAÇÕES AUTOMÁTICAS
// ==========================================

export const gerarNotificacoesAutomaticas = async (lancamentos, cartoes, metas, recorrencias) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não logado')

    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]
    const notificacoesCriadas = []

    // ==========================================
    // 1. ALERTAS DE VENCIMENTO (3, 5, 7 dias)
    // ==========================================
    const diasVencimento = [3, 5, 7]
    for (const dias of diasVencimento) {
      const dataAlerta = new Date(hoje)
      dataAlerta.setDate(dataAlerta.getDate() + dias)
      const dataAlertaStr = dataAlerta.toISOString().split('T')[0]

      const despesasVencendo = lancamentos.filter(item => 
        item.tipo === 'despesa' && 
        item.data === dataAlertaStr &&
        !item.pago
      )

      for (const despesa of despesasVencendo) {
        const notificacao = {
          tipo: 'vencimento',
          titulo: `🔔 Conta vence em ${dias} dias`,
          mensagem: `A despesa "${despesa.descricao}" (${despesa.categoria}) vence em ${dias} dias. Valor: R$ ${despesa.valor.toFixed(2)}`,
          link: '/lancamentos',
          icone: '⏰',
          cor: '#ed8936'
        }
        await criarNotificacao(notificacao)
        notificacoesCriadas.push(notificacao)
      }
    }

    // ==========================================
    // 2. ALERTAS DE LIMITE DE CARTÃO (70%, 85%, 100%)
    // ==========================================
    const limitesPercentuais = [70, 85, 100]
    for (const cartao of cartoes) {
      if (!cartao.limiteTotal || cartao.limiteTotal <= 0) continue
      
      const percentualUsado = ((cartao.limiteTotal - (cartao.limiteDisponivel || 0)) / cartao.limiteTotal) * 100
      
      for (const limite of limitesPercentuais) {
        if (percentualUsado >= limite) {
          const notificacao = {
            tipo: 'limite_cartao',
            titulo: `💳 Alerta de Limite - ${cartao.nome}`,
            mensagem: `O cartão "${cartao.nome}" atingiu ${percentualUsado.toFixed(0)}% do limite. Limite total: R$ ${cartao.limiteTotal.toFixed(2)}`,
            link: '/cartoes',
            icone: '💳',
            cor: '#fc8181'
          }
          await criarNotificacao(notificacao)
          notificacoesCriadas.push(notificacao)
          break // Só uma notificação por cartão
        }
      }
    }

    // ==========================================
    // 3. ALERTAS DE METAS (80%, 100%)
    // ==========================================
    for (const meta of metas) {
      const progresso = meta.progresso || 0
      
      if (progresso >= 100) {
        const notificacao = {
          tipo: 'meta_concluida',
          titulo: `🎉 Meta Concluída!`,
          mensagem: `Parabéns! Você atingiu sua meta "${meta.nome}"!`,
          link: '/metas',
          icone: '🎉',
          cor: '#48bb78'
        }
        await criarNotificacao(notificacao)
        notificacoesCriadas.push(notificacao)
      } else if (progresso >= 80) {
        const notificacao = {
          tipo: 'meta_progresso',
          titulo: `🎯 Meta quase lá!`,
          mensagem: `Sua meta "${meta.nome}" está em ${progresso.toFixed(0)}%! Continue assim!`,
          link: '/metas',
          icone: '🎯',
          cor: '#9f7aea'
        }
        await criarNotificacao(notificacao)
        notificacoesCriadas.push(notificacao)
      }
    }

    // ==========================================
    // 4. ALERTAS DE RECORRÊNCIA GERADA
    // ==========================================
    const hojeMes = hoje.getMonth() + 1
    const hojeAno = hoje.getFullYear()
    
    for (const recorrencia of recorrencias) {
      if (recorrencia.status !== 'ativo') continue
      
      const dataRecorrencia = new Date(recorrencia.proximoVencimento)
      const mesRecorrencia = dataRecorrencia.getMonth() + 1
      const anoRecorrencia = dataRecorrencia.getFullYear()
      
      if (mesRecorrencia === hojeMes && anoRecorrencia === hojeAno) {
        const notificacao = {
          tipo: 'recorrencia',
          titulo: `🔄 Conta fixa gerada`,
          mensagem: `A recorrência "${recorrencia.nome}" foi gerada automaticamente. Valor: R$ ${recorrencia.valor.toFixed(2)}`,
          link: '/recorrencias',
          icone: '🔄',
          cor: '#3a7abd'
        }
        await criarNotificacao(notificacao)
        notificacoesCriadas.push(notificacao)
      }
    }

    return notificacoesCriadas
  } catch (error) {
    console.error('Erro ao gerar notificações automáticas:', error)
    return []
  }
}