import apis from '../../apis'
import type { EditConfResponse } from '../../apis'
import { useRequest } from 'ahooks'
import type { TreeItem } from './types'
import type { DetailData, ChildrenItem, ClientRegistryInfo, LeafClassInfo } from '../../types'
import MindMapComponent from './components/mind-map'
import NodeFormModal from './components/node-form'
import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { App, Button, Modal, Spin, Tag } from 'antd'
import type { ChangeItem } from '../../types'
import NodeDiff from './components/node-diff'
import TreeDiffModal from './components/tree-diff-modal'

const nodeTypeNames: Record<number, string> = {
  0: 'NONE', 1: 'AND', 2: 'TRUE', 3: 'ALL', 4: 'ANY',
  5: 'LEAF_FLOW', 6: 'LEAF_RESULT', 7: 'LEAF_NONE',
  8: 'P_NONE', 9: 'P_AND', 10: 'P_TRUE', 11: 'P_ALL', 12: 'P_ANY',
}

const changeLabel = (c: ChangeItem): string => {
  const u = c.update
  let label = `#${c.confId}`
  if (u.name) label += `-${u.name}`
  if (u.confName) {
    label += ` (${u.confName.substring(u.confName.lastIndexOf('.') + 1)})`
  } else if (nodeTypeNames[u.type]) {
    label += ` (${nodeTypeNames[u.type]})`
  }
  return label
}

// Inline component for confirm dialog content that loads changes
const ConfirmChangesContent = ({ app, iceId, onViewNode }: {
  app: number; iceId: number; onViewNode: (confId: number) => void
}) => {
  const [changes, setChanges] = useState<ChangeItem[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apis.changes({ app, iceId })
      .then(res => setChanges(res.changes || []))
      .catch(() => setChanges([]))
      .finally(() => setLoading(false))
  }, [app, iceId])

  if (loading) return <Spin style={{ display: 'block', textAlign: 'center', padding: 20 }} />

  return (
    <div>
      {changes?.length ? (
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {changes.map(c => (
            <div key={c.confId} style={{ padding: '4px 0', fontSize: 13 }}>
              {changeLabel(c)}
              {' '}
              <Tag color="blue" style={{ marginLeft: 4, cursor: 'pointer' }} onClick={() => onViewNode(c.confId)}>
                查看
              </Tag>
            </div>
          ))}
        </div>
      ) : <div style={{ color: 'var(--color-text-secondary)', padding: '8px 0' }}>无变更</div>}
    </div>
  )
}
import OperationBar from './components/operation-bar'
import ImportModal from '../../components/modals/import-modal'
import ExportModal from '../../components/modals/export-modal'
import MockModal from './components/mock-modal'
import type { MockProcessNode } from './components/mock-modal'
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

interface MindMapHandle {
  resetView: () => void
  updateData: (treeList: TreeItem[], registeredClasses: Set<string> | null) => void
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

const Detail = ({ onBaseName }: { onBaseName?: (name?: string) => void }) => {
  const { message, modal } = App.useApp()
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
  const [mockVisible, setMockVisible] = useState(false)
  const [mockConfId, setMockConfId] = useState<number | undefined>(undefined)
  const [mockNodeName, setMockNodeName] = useState<string | undefined>(undefined)
  const [mockProcessNodes, setMockProcessNodes] = useState<MockProcessNode[]>([])
  const [selectorValue, setSelectorValue] = useState<string[]>(getInitialSelector)
  const [localTree, setLocalTree] = useState<ChildrenItem | null>(null)
  const [compareConfId, setCompareConfId] = useState<number | null>(null)
  const [compareData, setCompareData] = useState<ChangeItem[] | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [treeDiffOpen, setTreeDiffOpen] = useState(false)
  const mindMapRef = useRef<MindMapHandle>(null)

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

  useEffect(() => {
    onBaseName?.(treeData?.name)
  }, [treeData?.name, onBaseName])

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
      onSuccess: (data: NodeMeta & { fallbackReason?: string; actualLane?: string; actualAddress?: string }) => {
        if (data?.fallbackReason) {
          const newVal: string[] = data.actualLane ? [data.actualLane] : [TRUNK]
          if (data.actualAddress) newVal.push(data.actualAddress)
          persistSelector(newVal)
          message.warning(data.fallbackReason === 'lane_not_found' ? '泳道已不存在，已切回主干' : '客户端已离线，已切回泳道级别')
        }
      }
    }
  )

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
    interface CascaderOption {
      value: string; label: string; isLeaf?: boolean;
      children?: CascaderOption[]
    }
    const trunk: CascaderOption = {
      value: TRUNK, label: '主干',
      children: (meta?.clientRegistry?.mainClients || []).map(c => ({
        value: c.address, label: c.address, isLeaf: true
      }))
    }
    if (!trunk.children!.length) trunk.isLeaf = true

    const laneOptions = (meta?.lanes || []).map(laneName => {
      const clients = meta?.clientRegistry?.laneClients?.[laneName] || []
      const opt: CascaderOption = {
        value: laneName, label: `泳道: ${laneName}`,
        children: clients.map(c => ({ value: c.address, label: c.address, isLeaf: true }))
      }
      if (!opt.children!.length) opt.isLeaf = true
      return opt
    })
    return [trunk, ...laneOptions]
  }, [meta?.clientRegistry, meta?.lanes])

  const hasClients = useMemo(() => {
    const main = meta?.clientRegistry?.mainClients?.length || 0
    const lane = Object.values(meta?.clientRegistry?.laneClients || {}).reduce((s, v) => s + v.length, 0)
    return main + lane > 0
  }, [meta?.clientRegistry])

  const getTreeList = useCallback(
    (list: ChildrenItem[]): TreeItem[] =>
      list.map((item) => {
        const { children = [], showConf, ...rest } = item
        return {
          ...rest,
          showConf,
          key: `${showConf?.uniqueKey}`,
          children: getTreeList([
            ...(item.forward ? [{ ...item.forward, isForward: true }] : []),
            ...children,
          ]),
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

  const handleEditSuccess = useCallback((editType: number, params: Record<string, any>, response: EditConfResponse) => {
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

  const handleMoveSuccess = useCallback((params: Record<string, any>) => {
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

  const openCompare = async (confId: number) => {
    setCompareConfId(confId)
    setCompareLoading(true)
    setCompareData(null)
    try {
      const res = await apis.changes({ app, iceId, confId })
      setCompareData(res.changes || [])
    } catch { message.error('获取对比数据失败') }
    finally { setCompareLoading(false) }
  }

  const confirmAndApply = (title: string, apiCall: () => Promise<any>, successMsg: string) => {
    modal.confirm({
      title,
      content: <ConfirmChangesContent app={app} iceId={iceId}
        onViewNode={(confId) => { openCompare(confId) }}
      />,
      okText: '确认',
      cancelText: '取消',
      width: 480,
      onOk: async () => {
        await apiCall()
        refreshTree()
        message.success(successMsg)
        setMockVisible(false)
        setMockProcessNodes([])
      },
      footer: (_, { OkBtn, CancelBtn }) => (
        <>
          <Button color="orange" variant="outlined" onClick={() => { Modal.destroyAll(); setTreeDiffOpen(true) }}>详情</Button>
          <CancelBtn />
          <OkBtn />
        </>
      ),
    })
  }

  const release = () => confirmAndApply('确认应用所有变更吗？', () => apis.release({ app, iceId }), '应用成功')
  const clean = () => confirmAndApply('确认清除所有变更吗？', () => apis.updateClean({ app, iceId }), '已清除')

  return (
    <div className="detail-wrap">
      <OperationBar
        selectorValue={selectorValue}
        cascaderOptions={cascaderOptions}
        onSelectorChange={onSelectorChange}
        updateCount={updateCount}
        hasClients={hasClients}
        onImport={() => setImportVisible(true)}
        onExport={() => setExportVisible(true)}
        onRelease={release}
        onClean={clean}
        onMock={() => { setMockConfId(undefined); setMockNodeName(undefined); setMockVisible(true) }}
        onResetView={() => mindMapRef.current?.resetView()}
        onRefresh={refreshTree}
      />
      <div className="mind-map-area" style={{ position: 'relative' }}>
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
          onCompareNode={(node) => openCompare(node.showConf?.nodeId)}
          onDeleteSuccess={handleDeleteSuccess}
          onMoveSuccess={handleMoveSuccess}
          onMockNode={(node) => { setMockConfId(node.showConf?.nodeId); setMockNodeName(node.showConf?.labelName); setMockVisible(true) }}
          registeredClasses={registeredClasses}
          leafClassMap={meta?.leafClassMap}
          mockProcessNodes={mockProcessNodes}
          mockVisible={mockVisible}
        />
        <MockModal
          open={mockVisible}
          onClose={() => { setMockVisible(false); setMockProcessNodes([]) }}
          app={app}
          iceId={iceId}
          confId={mockConfId}
          nodeName={mockNodeName}
          lane={lane}
          address={address}
          selectorValue={selectorValue}
          onProcessResult={setMockProcessNodes}
          onFallback={() => { if (selectorValue.length > 1) persistSelector(selectorValue.slice(0, -1)) }}
        />
      </div>
      <NodeFormModal
        open={!!formState}
        onClose={() => setFormState(null)}
        app={app}
        iceId={iceId}
        lane={lane}
        onSuccess={handleEditSuccess}
        selectedNode={formState?.node}
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
      <Modal
        title={`节点对比 #${compareConfId ?? ''}`}
        open={compareConfId !== null}
        onCancel={() => setCompareConfId(null)}
        footer={null}
        width={720}
        destroyOnClose
        centered
        zIndex={2000}
      >
        {compareLoading ? <Spin style={{ display: 'block', textAlign: 'center', padding: 40 }} /> :
          compareData?.[0] ? <NodeDiff active={compareData[0].active} update={compareData[0].update} /> :
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>无变更数据</div>
        }
      </Modal>
      <TreeDiffModal
        open={treeDiffOpen}
        onClose={() => setTreeDiffOpen(false)}
        app={app}
        iceId={iceId}
        lane={lane}
        registeredClasses={registeredClasses}
      />
    </div>
  )
}

export default Detail
