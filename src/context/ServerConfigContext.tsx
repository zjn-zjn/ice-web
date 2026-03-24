import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import apis from '../apis'

interface PublishTarget {
  name: string
  url: string
}

interface ServerConfig {
  mode: string
  publishTargets: PublishTarget[]
  controlled: boolean
}

const ServerConfigContext = createContext<ServerConfig>({
  mode: 'open',
  publishTargets: [],
  controlled: false,
})

export const ServerConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ServerConfig>({
    mode: 'open',
    publishTargets: [],
    controlled: false,
  })

  useEffect(() => {
    apis.configInfo().then((data) => {
      setConfig({
        mode: data.mode || 'open',
        publishTargets: data.publishTargets || [],
        controlled: data.mode === 'controlled',
      })
    }).catch(() => {})
  }, [])

  return (
    <ServerConfigContext.Provider value={config}>
      {children}
    </ServerConfigContext.Provider>
  )
}

export const useServerConfig = () => useContext(ServerConfigContext)
