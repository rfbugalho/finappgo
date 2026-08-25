// src/services/exportService.js
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// ==========================================
// FORMATAR DADOS PARA EXPORTAÇÃO
// ==========================================
const formatarDadosParaExportacao = (lancamentos, totalReceitas, totalDespesas, saldo) => {
  // Cabeçalho do relatório
  const dados = [
    ['RELATÓRIO FINANCEIRO - FinAppGO'],
    [''],
    ['Data de geração:', new Date().toLocaleString('pt-BR')],
    [''],
    ['RESUMO'],
    ['Total de Receitas:', `R$ ${totalReceitas.toFixed(2)}`],
    ['Total de Despesas:', `R$ ${totalDespesas.toFixed(2)}`],
    ['Saldo:', `R$ ${saldo.toFixed(2)}`],
    ['Total de Lançamentos:', lancamentos.length],
    [''],
    ['DETALHES DOS LANÇAMENTOS'],
    ['Data', 'Descrição', 'Categoria', 'Subcategoria', 'Tipo', 'Valor (R$)']
  ]

  // Adicionar cada lançamento
  lancamentos.forEach(item => {
    dados.push([
      item.data || '-',
      item.descricao || '-',
      item.categoria || '-',
      item.subcategoria || '-',
      item.tipo === 'receita' ? 'Receita' : 'Despesa',
      item.valor ? item.valor.toFixed(2) : '0,00'
    ])
  })

  // Adicionar rodapé
  dados.push([''])
  dados.push(['Fim do relatório'])
  dados.push([`Gerado em ${new Date().toLocaleString('pt-BR')}`])

  return dados
}

// ==========================================
// EXPORTAR PARA CSV
// ==========================================
export const exportarCSV = (lancamentos, totalReceitas, totalDespesas, saldo, nomeArquivo = 'relatorio-financeiro') => {
  const dados = formatarDadosParaExportacao(lancamentos, totalReceitas, totalDespesas, saldo)
  
  // Converter para CSV
  let csv = ''
  dados.forEach(linha => {
    const linhaFormatada = linha.map(celula => {
      if (typeof celula === 'string' && celula.includes(',')) {
        return `"${celula}"`
      }
      return celula
    }).join(';')
    csv += linhaFormatada + '\n'
  })

  // Criar blob e baixar
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${nomeArquivo}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ==========================================
// EXPORTAR PARA EXCEL
// ==========================================
export const exportarExcel = (lancamentos, totalReceitas, totalDespesas, saldo, nomeArquivo = 'relatorio-financeiro') => {
  const dados = formatarDadosParaExportacao(lancamentos, totalReceitas, totalDespesas, saldo)
  
  // Criar workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(dados)
  
  // Ajustar largura das colunas
  ws['!cols'] = [
    { wch: 15 }, // Data
    { wch: 30 }, // Descrição
    { wch: 20 }, // Categoria
    { wch: 20 }, // Subcategoria
    { wch: 15 }, // Tipo
    { wch: 15 }  // Valor
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos')
  
  // Gerar arquivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `${nomeArquivo}.xlsx`)
}

// ==========================================
// EXPORTAR DADOS RESUMIDOS
// ==========================================
export const exportarResumo = (lancamentos, totalReceitas, totalDespesas, saldo, nomeArquivo = 'resumo-financeiro') => {
  // Agrupar por categoria
  const categorias = {}
  lancamentos.forEach(item => {
    const cat = item.categoria || 'Sem categoria'
    if (!categorias[cat]) {
      categorias[cat] = { receitas: 0, despesas: 0 }
    }
    if (item.tipo === 'receita') {
      categorias[cat].receitas += item.valor
    } else {
      categorias[cat].despesas += item.valor
    }
  })

  // Agrupar por mês
  const meses = {}
  lancamentos.forEach(item => {
    if (!item.data) return
    const mes = item.data.substring(0, 7)
    if (!meses[mes]) {
      meses[mes] = { receitas: 0, despesas: 0 }
    }
    if (item.tipo === 'receita') {
      meses[mes].receitas += item.valor
    } else {
      meses[mes].despesas += item.valor
    }
  })

  const dados = [
    ['RESUMO FINANCEIRO - FinAppGO'],
    [''],
    ['Data de geração:', new Date().toLocaleString('pt-BR')],
    [''],
    ['RESUMO GERAL'],
    ['Total de Receitas:', `R$ ${totalReceitas.toFixed(2)}`],
    ['Total de Despesas:', `R$ ${totalDespesas.toFixed(2)}`],
    ['Saldo:', `R$ ${saldo.toFixed(2)}`],
    ['Total de Lançamentos:', lancamentos.length],
    [''],
    ['RESUMO POR CATEGORIA'],
    ['Categoria', 'Receitas (R$)', 'Despesas (R$)', 'Saldo (R$)']
  ]

  Object.keys(categorias).forEach(cat => {
    const { receitas, despesas } = categorias[cat]
    dados.push([
      cat,
      receitas.toFixed(2),
      despesas.toFixed(2),
      (receitas - despesas).toFixed(2)
    ])
  })

  dados.push([''])
  dados.push(['RESUMO POR MÊS'])
  dados.push(['Mês', 'Receitas (R$)', 'Despesas (R$)', 'Saldo (R$)'])

  Object.keys(meses).sort().forEach(mes => {
    const { receitas, despesas } = meses[mes]
    const [ano, mesNum] = mes.split('-')
    const nomeMes = new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleString('pt-BR', { month: 'long' })
    dados.push([
      `${nomeMes}/${ano}`,
      receitas.toFixed(2),
      despesas.toFixed(2),
      (receitas - despesas).toFixed(2)
    ])
  })

  dados.push([''])
  dados.push(['Fim do relatório'])

  // Exportar como CSV
  let csv = ''
  dados.forEach(linha => {
    const linhaFormatada = linha.map(celula => {
      if (typeof celula === 'string' && celula.includes(',')) {
        return `"${celula}"`
      }
      return celula
    }).join(';')
    csv += linhaFormatada + '\n'
  })

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${nomeArquivo}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}