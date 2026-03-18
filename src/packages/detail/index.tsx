import apis from '../../apis'
import { useRequest } from 'ahooks'
import type { TreeItem } from './types'
import type { DetailData, ChildrenItem, ClientRegistryInfo, LeafClassInfo } from '../../index.d'
import MindMapComponent from './components/mind-map'
import NodeFormModal from './components/edit'
import type { NodeFormProps } from './components/edit'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { Button, Cascader, Space, Modal, message, Badge, Tooltip } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import ImportModal from '../config-list/components/import-modal'
import ExportModal from '../config-list/components/export-modal'
import { useLocation, useNavigate } from 'react-router-dom'
import './index.less'

interface NodeMeta {
  clientRegistry?: ClientRegistryInfo
  leafClassMap?: Record<number, LeafClassInfo[]>
  lanes?: string[]
}

const TRUNK = 'trunk'

const Detail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const iceId = searchParams.get('iceId') || ''
  const app = searchParams.get('app') || ''
  const urlLane = searchParams.get('lane')

  const STORAGE_KEY = `ice_selector_${app}`

  const getInitialSelector = (): string[] => {
    if (urlLane) return [urlLane]
    if (app) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved)
      } catch {}
      const oldLane = sessionStorage.getItem(`ice_lane_${app}`)
      if (oldLane) return [oldLane]
    }
    return [TRUNK]
  }

  const [selectedNode, setSelectedNode] = useState<TreeItem>()
  const [formState, setFormState] = useState<{ node: TreeItem; mode: 'edit' | 'add-child' | 'add-front' } | null>(null)
  const [importVisible, setImportVisible] = useState(false)
  const [exportVisible, setExportVisible] = useState(false)
  const [selectorValue, setSelectorValue] = useState<string[]>(getInitialSelector)
  const [focusMode, setFocusMode] = useState(false)

  const lane = selectorValue[0] === TRUNK ? undefined : selectorValue[0]
  const address = selectorValue.length > 1 ? selectorValue[1] : undefined

  useEffect(() => {
    const initial = getInitialSelector()
    setSelectorValue(initial)
    const initLane = initial[0] === TRUNK ? undefined : initial[0]
    if (initLane && !urlLane) {
      const params = new URLSearchParams(location.search)
      params.set('lane', initLane)
      navigate(`${location.pathname}?${params.toString()}`, { replace: true })
    }
  }, [iceId, app, urlLane])

  const { data: treeData, run: refreshTree } = useRequest<DetailData, any>(
    () => apis.details({ app, iceId, address: 'server', ...(lane ? { lane } : {}) } as any),
    { refreshDeps: [app, iceId, lane] }
  )

  const { data: meta } = useRequest<NodeMeta, any>(
    () => apis.nodeMeta({ app, ...(lane ? { lane } : {}), ...(address ? { address } : {}) }),
    {
      refreshDeps: [app, lane, address],
      onSuccess: (data: any) => {
        if (data?.fallbackReason) {
          const newVal: string[] = data.actualLane ? [data.actualLane] : [TRUNK]
          if (data.actualAddress) newVal.push(data.actualAddress)
          setSelectorValue(newVal)
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
          message.warning(data.fallbackReason === 'lane_not_found' ? '泳道已不存在，已切回主干' : '客户端已离线，已切回泳道级别')
        }
      }
    }
  )

  const persistSelector = (val: string[]) => {
    setSelectorValue(val)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    const newLane = val[0] === TRUNK ? undefined : val[0]
    const params = new URLSearchParams(location.search)
    if (newLane) {
      params.set('lane', newLane)
    } else {
      params.delete('lane')
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true })
  }

  const onSelectorChange = (value: (string | number)[]) => {
    persistSelector(value.map(String))
  }

  const selectedClientClasses = useMemo(() => {
    if (!address || !meta?.clientRegistry) return null
    const allClients = [
      ...(meta.clientRegistry.mainClients || []),
      ...Object.values(meta.clientRegistry.laneClients || {}).flat()
    ]
    const client = allClients.find(c => c.address === address)
    return client ? new Set(client.classes) : null
  }, [address, meta?.clientRegistry])

  const cascaderOptions = useMemo(() => {
    const trunk: any = {
      value: TRUNK, label: '主干',
      children: (meta?.clientRegistry?.mainClients || []).map(c => ({
        value: c.address, label: c.address, isLeaf: true
      }))
    }
    if (!trunk.children.length) trunk.isLeaf = true

    const laneOptions = (meta?.lanes || []).map(laneName => {
      const clients = meta?.clientRegistry?.laneClients?.[laneName] || []
      const opt: any = {
        value: laneName, label: `泳道: ${laneName}`,
        children: clients.map(c => ({ value: c.address, label: c.address, isLeaf: true }))
      }
      if (!opt.children.length) opt.isLeaf = true
      return opt
    })
    return [trunk, ...laneOptions]
  }, [meta?.clientRegistry, meta?.lanes])

  const getTreeList = useCallback(
    (list: ChildrenItem[]): TreeItem[] =>
      list.map((item) => {
        const { children = [], showConf, ...reset } = item
        return {
          ...reset,
          showConf,
          key: `${showConf?.uniqueKey}`,
          children: getTreeList([
            ...(item.forward ? [{ ...item.forward, isForward: true }] : []),
            ...children,
          ]),
          title: showConf?.labelName || ''
        }
      }),
    []
  )

  const treeList = useMemo(() => {
    const root = treeData?.root
    return root ? getTreeList([{ ...root, isRoot: true }]) : []
  }, [treeData?.root])

  const release = () => {
    const updatingNodes: string[] = []
    const collectUpdating = (items: TreeItem[]) => {
      for (const item of items) {
        if (item.showConf?.updating) {
          updatingNodes.push(`${item.showConf.nodeId} - ${item.showConf.labelName}`)
        }
        if (item.children) collectUpdating(item.children)
      }
    }
    collectUpdating(treeList)

    Modal.confirm({
      title: '确认发布所有变更吗？',
      width: 480,
      content: updatingNodes.length > 0 ? (
        <div style={{ maxHeight: 300, overflow: 'auto', marginTop: 8 }}>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>{updatingNodes.length} 个节点有变更：</div>
          {updatingNodes.map((n, i) => (
            <div key={i} style={{ fontSize: 12, color: '#666', padding: '2px 0' }}>{n}</div>
          ))}
        </div>
      ) : undefined,
      onOk: async () => {
        try {
          await apis.release({ app, iceId })
          refreshTree()
          message.success('发布成功')
        } catch {}
      }
    })
  }

  const clean = () => {
    Modal.confirm({
      title: '确认清除所有变更吗？',
      onOk: async () => {
        try {
          await apis.updateClean({ app, iceId })
          refreshTree()
          message.success('已清除')
        } catch {}
      }
    })
  }

  return (
    <div className={`detail-wrap ${focusMode ? 'focus-mode' : ''}`}>
      <div className={`operation-wrap ${focusMode ? 'focus-bar' : ''}`}>
        <Space>
          <Cascader
            value={selectorValue}
            options={cascaderOptions}
            onChange={onSelectorChange}
            changeOnSelect
            expandTrigger="hover"
            style={{ width: 260 }}
            placeholder="主干"
            allowClear={false}
          />
          <Button onClick={() => setImportVisible(true)}>导入</Button>
          <Button onClick={() => setExportVisible(true)}>导出</Button>
          <Badge count={treeData?.updateCount || 0} size="small" offset={[-4, 2]}>
            <Button onClick={release}
              style={treeData?.updateCount ? { borderColor: '#ff4d4f', color: '#ff4d4f' } : undefined}>发布</Button>
          </Badge>
          <Button onClick={clean}>清除</Button>
          <Tooltip title={focusMode ? "退出专注模式" : "专注模式"}>
            <Button
              icon={focusMode ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => setFocusMode(!focusMode)}
            />
          </Tooltip>
        </Space>
      </div>
      <div className="mind-map-area">
        <MindMapComponent
          treeList={treeList}
          refresh={refreshTree}
          setSelectedNode={setSelectedNode}
          selectedNode={selectedNode}
          app={app}
          iceId={iceId}
          lane={lane}
          onEditNode={(node) => setFormState({ node, mode: 'edit' })}
          onAddChild={(node) => setFormState({ node, mode: 'add-child' })}
          onAddFront={(node) => setFormState({ node, mode: 'add-front' })}
          selectedClientClasses={selectedClientClasses}
          leafClassMap={meta?.leafClassMap}
        />
      </div>
      <NodeFormModal
        open={!!formState}
        onClose={() => setFormState(null)}
        app={app}
        iceId={iceId}
        refresh={refreshTree}
        selectedNode={formState?.node as any}
        leafClassMap={meta?.leafClassMap}
        mode={formState?.mode}
      />
      <ImportModal
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        onOk={() => {
          setImportVisible(false)
          refreshTree()
        }}
        app={app}
      />
      <ExportModal
        open={exportVisible}
        onCancel={() => setExportVisible(false)}
        onOk={() => setExportVisible(false)}
        app={app}
        iceId={iceId}
      />
    </div>
  )
}

export default Detail
