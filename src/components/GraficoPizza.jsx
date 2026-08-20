import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

function GraficoPizza({ lancamentos }) {
  const categorias = {}
  lancamentos
    .filter(item => item.tipo === 'despesa')
    .forEach(item => {
      if (!categorias[item.categoria]) categorias[item.categoria] = 0
      categorias[item.categoria] += item.valor
    })

  const labels = Object.keys(categorias)
  const valores = Object.values(categorias)

  const cores = ['#d94a4a', '#e07c2c', '#2d8a4e', '#3a7abd', '#b794f4', '#f687b3']

  const data = {
    labels,
    datasets: [
      {
        data: valores,
        backgroundColor: cores.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#0d1b2a'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255,255,255,0.6)'
        }
      }
    }
  }

  return <Pie data={data} options={options} />
}

export default GraficoPizza