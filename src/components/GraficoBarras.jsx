import React from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function GraficoBarras({ lancamentos }) {
  const meses = {}
  lancamentos.forEach(item => {
    const mes = item.data.substring(0, 7)
    if (!meses[mes]) meses[mes] = { receita: 0, despesa: 0 }
    if (item.tipo === 'receita') meses[mes].receita += item.valor
    else meses[mes].despesa += item.valor
  })

  const labels = Object.keys(meses)
  const receitas = labels.map(mes => meses[mes].receita)
  const despesas = labels.map(mes => meses[mes].despesa)

  const data = {
    labels,
    datasets: [
      {
        label: 'Receitas',
        data: receitas,
        backgroundColor: '#2d8a4e',
        borderRadius: 4
      },
      {
        label: 'Despesas',
        data: despesas,
        backgroundColor: '#d94a4a',
        borderRadius: 4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255,255,255,0.6)'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255,255,255,0.4)'
        },
        grid: {
          color: 'rgba(255,255,255,0.05)'
        }
      },
      x: {
        ticks: {
          color: 'rgba(255,255,255,0.4)'
        },
        grid: {
          color: 'rgba(255,255,255,0.05)'
        }
      }
    }
  }

  return <Bar data={data} options={options} />
}

export default GraficoBarras