import { useEffect, useMemo, useState } from 'react'
import { useRequest } from 'ahooks'
import { Popover } from 'antd'
import { DownOutlined, GithubOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AppSelector from './app-selector'
import FolderPopover from './folder-popover'
import apis from '../../../apis'
import logoImg from '../../../assets/logo.svg'

interface Props {
  appId?: number
  folderPath: string
  baseId?: string
}

const BreadcrumbNav = ({ appId, folderPath, baseId }: Props) => {
  const navigate = useNavigate()
  const [appPopoverOpen, setAppPopoverOpen] = useState(false)
  const [activeFolderLevel, setActiveFolderLevel] = useState<number | null>(null)

  const { data: appData } = useRequest(
    () => apis.appList(),
    { refreshDeps: [appId] }
  )
  const appName = useMemo(() => {
    if (!appId || !appData?.list) return ''
    const app = appData.list.find((a: any) => a.id === appId)
    return app?.name || ''
  }, [appId, appData])

  // Verify folder path exists, fallback to nearest ancestor if not
  useEffect(() => {
    if (!appId || !folderPath) return
    apis.folderList({ app: appId, path: folderPath, pageNum: 1, pageSize: 1 }).then((data: any) => {
      if (data && data.actualPath !== data.path) {
        const newUrl = data.actualPath
          ? `/app/${appId}/base/${data.actualPath}`
          : `/app/${appId}/base`
        navigate(newUrl, { replace: true })
      }
    }).catch(() => {})
  }, [appId, folderPath, navigate])

  const segments = useMemo(() => {
    if (!folderPath) return []
    return folderPath.split('/').filter(Boolean)
  }, [folderPath])

  const breadcrumbItems = useMemo(() => {
    if (!appId) return []
    const items: { label: string; path: string; level: number }[] = []
    items.push({ label: 'Rule', path: '', level: 0 })
    segments.forEach((seg, idx) => {
      items.push({
        label: seg,
        path: segments.slice(0, idx + 1).join('/'),
        level: idx + 1
      })
    })
    return items
  }, [appId, segments])

  const handleNavigateFolder = (newPath: string) => {
    navigate(`/app/${appId}/base/${newPath}`)
    const newLevel = newPath.split('/').filter(Boolean).length
    setTimeout(() => setActiveFolderLevel(newLevel), 50)
  }

  const handleFolderOpenChange = (open: boolean, level: number) => {
    if (!open && document.querySelector('.ant-modal-wrap:not([style*="display: none"])')) {
      // Don't close popover when a visible modal (e.g. delete confirm) is open
      return
    }
    setActiveFolderLevel(open ? level : null)
  }

  return (
    <div className="breadcrumb-bar">
      {/* App selector */}
      <Popover
        content={
          <AppSelector
            currentAppId={appId}
            onClose={() => setAppPopoverOpen(false)}
            onSelect={() => setTimeout(() => setActiveFolderLevel(0), 100)}
          />
        }
        trigger="click"
        open={appPopoverOpen}
        onOpenChange={setAppPopoverOpen}
        placement="bottomLeft"
      >
        <span className="app-selector-trigger">
          {appId ? (appName ? `App-${appName} #${appId}` : `App #${appId}`) : '选择App'}
          <DownOutlined style={{ fontSize: 10 }} />
        </span>
      </Popover>

      {appId && breadcrumbItems.map((item, idx) => (
        <span key={item.level} style={{ display: 'flex', alignItems: 'center' }}>
          <span className="breadcrumb-separator">/</span>
          <Popover
            content={
              <FolderPopover
                appId={appId}
                path={item.path}
                currentBaseId={baseId}
                onClose={() => setActiveFolderLevel(null)}
                onNavigateFolder={handleNavigateFolder}
              />
            }
            trigger="click"
            open={activeFolderLevel === item.level}
            onOpenChange={(open) => handleFolderOpenChange(open, item.level)}
            placement="bottomLeft"
          >
            <span className="breadcrumb-item">
              {item.label}
            </span>
          </Popover>
        </span>
      ))}

      {/* Base ID segment */}
      {baseId && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
        <span className="breadcrumb-separator">/</span>
        <Popover
          content={
            <FolderPopover
              appId={appId!}
              path={folderPath}
              currentBaseId={baseId}
              onClose={() => setActiveFolderLevel(null)}
              onNavigateFolder={handleNavigateFolder}
            />
          }
          trigger="click"
          open={activeFolderLevel === -1}
          onOpenChange={(open) => handleFolderOpenChange(open, -1)}
          placement="bottomLeft"
        >
          <span className="breadcrumb-item active">
            {baseId}
          </span>
        </Popover>
        </span>
      )}

      {/* Right: logo + GitHub */}
      <div className="breadcrumb-right">
        <a href="http://waitmoon.com" target="_blank" rel="noopener noreferrer" className="breadcrumb-link">
          <img src={logoImg} alt="ICE" style={{ height: 22, verticalAlign: 'middle' }} />
        </a>
        <a href="https://github.com/zjn-zjn/ice" target="_blank" rel="noopener noreferrer" className="breadcrumb-link">
          <GithubOutlined style={{ fontSize: 18 }} />
        </a>
      </div>
    </div>
  )
}

export default BreadcrumbNav
