import { useParams, useLocation } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import BreadcrumbNav from './components/breadcrumb-nav'
import Detail from '../detail'
import WelcomeScreen from './components/welcome-screen'
import './index.less'

const MainLayout = () => {
  const { appId } = useParams()
  const location = useLocation()
  const [baseName, setBaseName] = useState<string>()

  // Parse the wildcard path after /app/:appId/base/
  const basePath = useMemo(() => {
    if (!appId) return null
    const prefix = `/app/${appId}/base`
    if (!location.pathname.startsWith(prefix)) return null
    const rest = decodeURIComponent(location.pathname.slice(prefix.length))
    return rest.startsWith('/') ? rest.slice(1) : rest
  }, [appId, location.pathname])

  // Determine if last segment is a base ID (numeric)
  const baseInfo = useMemo(() => {
    if (basePath === null || basePath === undefined) return null
    if (basePath === '') return null // root directory, no base selected
    const segments = basePath.split('/')
    const lastSeg = segments[segments.length - 1]
    if (/^\d+$/.test(lastSeg)) {
      const folderPath = segments.slice(0, -1).join('/')
      return { baseId: lastSeg, folderPath }
    }
    return null // it's a folder path
  }, [basePath])

  const showCanvas = !!baseInfo && !!appId
  const currentFolderPath = baseInfo ? baseInfo.folderPath : (basePath ?? '')

  const handleBaseName = useCallback((name?: string) => {
    setBaseName(name)
  }, [])

  return (
    <div className="main-layout">
      <BreadcrumbNav
        appId={appId ? Number(appId) : undefined}
        folderPath={currentFolderPath}
        baseId={baseInfo?.baseId}
        baseName={baseName}
        onBaseNameChange={handleBaseName}
      />
      <div className="main-content">
        {!appId ? (
          <WelcomeScreen type="no-app" />
        ) : showCanvas ? (
          <Detail key={`${appId}-${baseInfo.baseId}`} onBaseName={handleBaseName} />
        ) : (
          <WelcomeScreen type="no-base" />
        )}
      </div>
    </div>
  )
}

export default MainLayout
