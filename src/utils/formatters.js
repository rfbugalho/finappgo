// src/utils/formatters.js

// ==========================================
// FORMATAR MOEDA COM SEPARADOR DE MILHARES
// ==========================================
export const formatarMoeda = (valor, moeda = 'R$') => {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return `${moeda} 0,00`
  }
  
  const valorFormatado = valor.toFixed(2)
  const partes = valorFormatado.split('.')
  const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const decimal = partes[1]
  
  return `${moeda} ${inteiro},${decimal}`
}

// ==========================================
// FORMATAR DATA
// ==========================================
export const formatarData = (data) => {
  if (!data) return '-'
  const partes = data.split('-')
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

// ==========================================
// FORMATAR DATA COM HORA
// ==========================================
export const formatarDataHora = (data) => {
  if (!data) return '-'
  const d = new Date(data)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ==========================================
// FORMATAR PORCENTAGEM
// ==========================================
export const formatarPorcentagem = (valor) => {
  return `${valor.toFixed(1)}%`
}

// ==========================================
// FORMATAR NÚMERO COM SEPARADOR DE MILHARES
// ==========================================
export const formatarNumero = (valor) => {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return '0'
  }
  return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}