import React, { createContext, useState, useEffect, useContext } from 'react'
import { buscarConfiguracoes, atualizarConfiguracoes } from '../firebase/configuracoesService'

const ConfigContext = createContext()

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    tema: 'dark',
    moeda: 'R$',
    formatoData: 'DD/MM/YYYY',
    notificacoes: true
  })
  const [carregando, setCarregando] = useState(true)
  const [configId, setConfigId] = useState(null)

  const carregarConfiguracoes = async () => {
    setCarregando(true)
    const dados = await buscarConfiguracoes()
    if (dados) {
      setConfig({
        tema: dados.tema || 'dark',
        moeda: dados.moeda || 'R$',
        formatoData: dados.formatoData || 'DD/MM/YYYY',
        notificacoes: dados.notificacoes !== undefined ? dados.notificacoes : true
      })
      setConfigId(dados.id)
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  const atualizarConfig = async (novasConfig) => {
    try {
      const dados = await atualizarConfiguracoes(configId, novasConfig)
      setConfig(novasConfig)
      return dados
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      throw error
    }
  }

  const formatarMoeda = (valor) => {
    const moeda = config.moeda || 'R$'
    return `${moeda} ${(valor || 0).toFixed(2).replace('.', ',')}`
  }

  const formatarData = (data) => {
    if (!data) return '-'
    const partes = data.split('-')
    if (config.formatoData === 'MM/DD/YYYY') {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  return (
    <ConfigContext.Provider value={{
      config,
      configId,
      carregando,
      atualizarConfig,
      formatarMoeda,
      formatarData,
      recarregar: carregarConfiguracoes
    }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}