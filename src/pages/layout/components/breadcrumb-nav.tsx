import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRequest } from 'ahooks'
import { Popover } from 'antd'
import { DownOutlined, GithubOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AppSelector from './app-selector'
import FolderPopover from './folder-popover'
import apis from '../../../apis'
import logoImg from '../../../assets/logo.svg'
import { useTheme } from '../../../theme/ThemeContext'

interface Props {
  appId?: number
  folderPath: string
  baseId?: string
  baseName?: string
  onBaseNameChange?: (name: string) => void
}

const BreadcrumbNav = ({ appId, folderPath, baseId, baseName, onBaseNameChange }: Props) => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [appPopoverOpen, setAppPopoverOpen] = useState(false)
  const [activeFolderLevel, setActiveFolderLevel] = useState<number | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [])

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  const [appNameOverride, setAppNameOverride] = useState<string>()
  const { data: appData } = useRequest(
    () => apis.appList({ app: appId }),
    { refreshDeps: [appId], ready: !!appId, onSuccess: () => setAppNameOverride(undefined) }
  )
  const appName = appNameOverride ?? (appData?.list?.length ? appData.list[0]?.name || '' : '')

  // Verify folder path exists, fallback to nearest ancestor if not
  useEffect(() => {
    if (!appId || !folderPath) return
    apis.folderList({ app: appId, path: folderPath, pageNum: 1, pageSize: 1 }).then((data) => {
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
    safeTimeout(() => setActiveFolderLevel(newLevel), 50)
  }

  const handleFolderOpenChange = (open: boolean, level: number) => {
    if (!open) {
      // Don't close popover when a modal (e.g. delete confirm) is open
      // Modal.confirm uses document.body as container, check if any modal root exists
      const modalCount = document.querySelectorAll('.ant-modal-confirm').length
      if (modalCount > 0) return
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
            onSelect={() => safeTimeout(() => setActiveFolderLevel(0), 100)}
            onAppNameChange={setAppNameOverride}
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
                onBaseNameChange={onBaseNameChange}
              />
            }
            trigger="click"
            destroyTooltipOnHide
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
              onBaseNameChange={onBaseNameChange}
            />
          }
          trigger="click"
          destroyTooltipOnHide
          open={activeFolderLevel === -1}
          onOpenChange={(open) => handleFolderOpenChange(open, -1)}
          placement="bottomLeft"
        >
          <span className="breadcrumb-item active">
            {baseId}{baseName ? <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'normal' }}> #{baseName}</span> : null}
          </span>
        </Popover>
        </span>
      )}

      {/* Right: theme toggle + logo + GitHub */}
      <div className="breadcrumb-right">
        <span className="breadcrumb-link" onClick={toggleTheme} style={{ cursor: 'pointer' }}>
          {isDark ? <SunOutlined style={{ fontSize: 16 }} /> : <MoonOutlined style={{ fontSize: 16 }} />}
        </span>
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
