import apis from '../../apis'
import type { EditConfResponse } from '../../apis'
import { useRequest } from 'ahooks'
import type { TreeItem } from './types'
import type { DetailData, ChildrenItem, ClientRegistryInfo, LeafClassInfo } from '../../index.d'
import MindMapComponent from './components/mind-map'
import NodeFormModal from './components/edit'
import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { Button, Cascader, Space, Modal, message, Badge } from 'antd'
import { AimOutlined, ReloadOutlined } from '@ant-design/icons'
import ImportModal from '../config-list/components/import-modal'
import ExportModal from '../config-list/components/export-modal'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  cloneTree, regenerateUniqueKeys, patchAddChild, patchRemoveChild,
  patchSetForward, patchUpdateProps, patchReplaceChild, patchMoveChild,
  buildNewNode, walkTree
} from './utils/tree-patch'
import './index.less'

interface NodeMeta {
  clientRegistry?: ClientRegistryInfo
  leafClassMap?: Record<number, LeafClassInfo[]>
  lanes?: string[]
}

const TRUNK = 'trunk'

// Extract app and iceId from either new URL pattern or legacy query params
function useAppAndIceId() {
  const { appId } = useParams()
  const location = useLocation()

  if (appId) {
    // New URL pattern: /app/:appId/base/.../iceId
    const prefix = `/app/${appId}/base`
    const rest = decodeURIComponent(location.pathname.slice(prefix.length)).replace(/^\//, '')
    const segments = rest.split('/').filter(Boolean)
    const iceId = segments[segments.length - 1] || ''
    return { app: Number(appId), iceId: Number(iceId) }
  }

  // Legacy query params
  const searchParams = new URLSearchParams(location.search)
  return {
    app: Number(searchParams.get('app') || 0),
    iceId: Number(searchParams.get('iceId') || 0)
  }
}

function countUpdatingByNodeId(root: ChildrenItem): number {
  const seen = new Set<number>()
  walkTree(root, (node) => {
    if (node.showConf?.updating && node.showConf.nodeId) {
      seen.add(node.showConf.nodeId)
    }
  })
  return seen.size
}

const Detail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { app, iceId } = useAppAndIceId()
  const searchParams = new URLSearchParams(location.search)
  const urlLane = searchParams.get('lane')
  const urlAddress = searchParams.get('address')

  const STORAGE_KEY = `ice_selector_${app}`

  const getInitialSelector = (): string[] => {
    if (urlLane) {
      const val = [urlLane]
      if (urlAddress) val.push(urlAddress)
      return val
    }
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
  const [localTree, setLocalTree] = useState<ChildrenItem | null>(null)
  const mindMapRef = useRef<any>(null)

  const lane = selectorValue[0] === TRUNK ? undefined : selectorValue[0]
  const address = selectorValue.length > 1 ? selectorValue[1] : undefined

  useEffect(() => {
    const initial = getInitialSelector()
    setSelectorValue(initial)
    const initLane = initial[0] === TRUNK ? undefined : initial[0]
    const initAddress = initial.length > 1 ? initial[1] : undefined
    if ((initLane && !urlLane) || (initAddress && !urlAddress)) {
      const params = new URLSearchParams(location.search)
      if (initLane) params.set('lane', initLane)
      if (initAddress) params.set('address', initAddress)
      navigate(`${location.pathname}?${params.toString()}`, { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iceId, app, urlLane, urlAddress])

  const { data: treeData, run: refreshTree } = useRequest<DetailData, any>(
    () => apis.details({ app, iceId, address: 'server', ...(lane ? { lane } : {}) }),
    {
      refreshDeps: [app, iceId, lane],
      onError: () => {
        // Base doesn't exist, navigate up to folder level
        const prefix = `/app/${app}/base`
        const rest = decodeURIComponent(location.pathname.slice(prefix.length)).replace(/^\//, '')
        const segments = rest.split('/').filter(Boolean)
        segments.pop() // remove the iceId
        const parentPath = segments.length ? `${prefix}/${segments.join('/')}` : prefix
        navigate(parentPath, { replace: true })
        message.warning('Rule 不存在，已返回上级目录')
      }
    }
  )

  // Sync API response to localTree
  useEffect(() => {
    if (treeData?.root) {
      setLocalTree(cloneTree(treeData.root))
    }
  }, [treeData?.root])

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
    const newAddress = val.length > 1 ? val[1] : undefined
    if (newAddress) {
      params.set('address', newAddress)
    } else {
      params.delete('address')
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true })
  }

  const onSelectorChange = (value: (string | number)[]) => {
    persistSelector(value.map(String))
  }

  const registeredClasses = useMemo(() => {
    if (!meta?.leafClassMap) return null
    const classes = new Set<string>()
    for (const list of Object.values(meta.leafClassMap)) {
      for (const c of list) classes.add(c.clazz)
    }
    return classes
  }, [meta?.leafClassMap])

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
    return localTree ? getTreeList([{ ...localTree, isRoot: true }]) : []
  }, [localTree])

  // Local update count deduped by nodeId
  const updateCount = useMemo(() => {
    if (!localTree) return 0
    return countUpdatingByNodeId(localTree)
  }, [localTree])

  const patchTree = useCallback((patcher: (root: ChildrenItem) => void) => {
    setLocalTree(prev => {
      if (!prev) return prev
      const next = cloneTree(prev)
      patcher(next)
      regenerateUniqueKeys(next, '', true, false)
      return next
    })
  }, [])

  const handleEditSuccess = useCallback((editType: number, params: any, response: EditConfResponse) => {
    switch (editType) {
      case 1: // ADD_SON
        if (params.multiplexIds && response.nodes?.length) {
          patchTree(root => {
            for (const node of response.nodes!) {
              patchAddChild(root, params.selectId, node)
            }
          })
        } else {
          patchTree(root => {
            const newNode = buildNewNode(response.nodeId, params)
            patchAddChild(root, params.selectId, newNode)
          })
        }
        break
      case 2: // EDIT
        patchTree(root => patchUpdateProps(root, params.selectId, params))
        break
      case 4: // ADD_FORWARD
        if (params.multiplexIds && response.nodes?.length) {
          patchTree(root => patchSetForward(root, params.selectId, response.nodes![0]))
        } else {
          patchTree(root => {
            const newNode = buildNewNode(response.nodeId, params)
            patchSetForward(root, params.selectId, newNode)
          })
        }
        break
      case 5: // EXCHANGE
        if (params.multiplexIds && response.nodes?.length) {
          if (response.nodes.length > 1) {
            // Multiple node replacement is complex, fallback to full refresh
            refreshTree()
            return
          }
          if (params.parentId != null && params.index != null) {
            patchTree(root => patchReplaceChild(root, params.parentId, params.index, response.nodes![0]))
          } else if (params.nextId != null) {
            patchTree(root => patchSetForward(root, params.nextId, response.nodes![0]))
          }
        } else {
          patchTree(root => patchUpdateProps(root, params.selectId, {
            ...params,
            nodeType: params.nodeType,
            confName: params.confName,
            confField: params.confField,
          }))
        }
        break
    }
  }, [patchTree])

  const handleDeleteSuccess = useCallback((params: { selectId: number; parentId?: number; nextId?: number; index?: number }) => {
    patchTree(root => {
      if (params.parentId != null && params.index != null) {
        patchRemoveChild(root, params.parentId, params.index)
      }
      if (params.nextId != null) {
        patchSetForward(root, params.nextId, undefined)
      }
    })
  }, [patchTree])

  const handleMoveSuccess = useCallback((params: any) => {
    // forward-to-forward move is complex, fallback to full refresh
    if (params.nextId != null && !params.moveToParentId) {
      refreshTree()
      return
    }

    patchTree(root => {
      const toParentId = params.moveToParentId ?? params.parentId
      const toIndex = params.moveTo

      if (params.nextId != null) {
        // Move from forward to parent's children
        // Find the forward node data before removing
        let forwardData: ChildrenItem | undefined
        walkTree(root, (node) => {
          if (node.showConf?.nodeId === params.nextId && node.forward?.showConf?.nodeId === params.selectId) {
            forwardData = cloneTree(node.forward!)
          }
        })
        // Remove forward
        patchSetForward(root, params.nextId, undefined)
        // Add to target parent
        if (forwardData) {
          patchAddChild(root, toParentId, forwardData)
        }
        return
      }

      const fromParentId = params.parentId
      const fromIndex = params.index
      if (fromIndex == null || fromIndex < 0) return
      patchMoveChild(root, fromParentId, fromIndex, toParentId, toIndex)
    })
  }, [patchTree, refreshTree])

  const release = () => {
    const updatingNodes: string[] = []
    const seen = new Set<number>()
    const collectUpdating = (items: TreeItem[]) => {
      for (const item of items) {
        if (item.showConf?.updating && !seen.has(item.showConf.nodeId)) {
          seen.add(item.showConf.nodeId)
          updatingNodes.push(item.showConf.labelName)
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
    const updatingNodes: string[] = []
    const seen = new Set<number>()
    const collectUpdating = (items: TreeItem[]) => {
      for (const item of items) {
        if (item.showConf?.updating && !seen.has(item.showConf.nodeId)) {
          seen.add(item.showConf.nodeId)
          updatingNodes.push(item.showConf.labelName)
        }
        if (item.children) collectUpdating(item.children)
      }
    }
    collectUpdating(treeList)

    Modal.confirm({
      title: '确认清除所有变更吗？',
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
          await apis.updateClean({ app, iceId })
          refreshTree()
          message.success('已清除')
        } catch {}
      }
    })
  }

  return (
    <div className="detail-wrap">
      <div className="operation-wrap">
        <Space size={12}>
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
          <Badge count={updateCount} size="small" offset={[-4, 2]}>
            <Button onClick={release}
              style={updateCount ? { borderColor: '#ff4d4f', color: '#ff4d4f' } : undefined}>发布</Button>
          </Badge>
          <Button onClick={clean}>清除</Button>
          <Button
            icon={<AimOutlined />}
            onClick={() => mindMapRef.current?.resetView()}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={refreshTree}
            title="刷新"
          />
        </Space>
      </div>
      <div className="mind-map-area">
        <MindMapComponent
          ref={mindMapRef}
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
          onDeleteSuccess={handleDeleteSuccess}
          onMoveSuccess={handleMoveSuccess}
          registeredClasses={registeredClasses}
          leafClassMap={meta?.leafClassMap}
        />
      </div>
      <NodeFormModal
        open={!!formState}
        onClose={() => setFormState(null)}
        app={app}
        iceId={iceId}
        lane={lane}
        onSuccess={handleEditSuccess}
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
