import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Modal, Spin, App } from 'antd'
import MindMap from 'simple-mind-map'
import apis from '../../../apis'
import type { DetailData, ChildrenItem, ChangeItem } from '../../../types'
import type { TreeItem } from '../types'
import { transformTreeToMindMap, getThemeConfig } from './mind-map/utils'
import { useTheme } from '../../../theme/ThemeContext'
import NodeDiff from './node-diff'

interface Props {
  open: boolean
  onClose: () => void
  app: number
  iceId: number
  lane?: string
  registeredClasses: Set<string> | null
}

const getTreeList = (list: ChildrenItem[]): TreeItem[] =>
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
    } as TreeItem
  })

// Collect all nodeIds that have updating=true
const collectUpdatingIds = (root: ChildrenItem): Set<number> => {
  const ids = new Set<number>()
  const walk = (node: ChildrenItem) => {
    if (node.showConf?.updating && node.showConf.nodeId) {
      ids.add(node.showConf.nodeId)
    }
    if (node.forward) walk(node.forward)
    if (node.children) node.children.forEach(walk)
  }
  walk(root)
  return ids
}

// Build a mind-map data with changed nodes highlighted
const transformWithHighlight = (
  treeItems: TreeItem[],
  registeredClasses: Set<string> | null,
  isDark: boolean,
  changedIds: Set<number>,
  side: 'left' | 'right'
): any => {
  const data = transformTreeToMindMap(treeItems, registeredClasses, isDark)
  if (!data) return data

  const markChanged = (node: any) => {
    if (!node?.data) return
    const nodeId = node.data.showConf?.nodeId
    if (nodeId && changedIds.has(nodeId)) {
      node.data.borderColor = side === 'right' ? '#faad14' : '#1677ff'
      node.data.borderWidth = 2
      node.data.borderDasharray = '6,3'
    }
    if (node.children) node.children.forEach(markChanged)
  }
  markChanged(data)
  return data
}

const ReadOnlyMindMap = ({
  data,
  isDark,
  onNodeClick,
}: {
  data: any
  isDark: boolean
  onNodeClick?: (nodeId: number) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mindMapRef = useRef<any>(null)
  const onNodeClickRef = useRef(onNodeClick)
  onNodeClickRef.current = onNodeClick

  useEffect(() => {
    if (!containerRef.current) return

    mindMapRef.current = new MindMap({
      el: containerRef.current,
      data: data || { data: { id: 'root', text: '-', expanded: true, isroot: true, direction: 2 }, children: [] },
      layout: 'logicalStructure',
      direction: 2,
      view: { zoom: 0.7 },
      draggable: true,
      mousewheelZoom: true,
      readonly: true,
      themeConfig: getThemeConfig(isDark),
    } as any)

    mindMapRef.current.on('node_tree_render_end', async () => {
      await new Promise(resolve => requestAnimationFrame(resolve))
      mindMapRef.current?.view?.translateXTo(-200)
      mindMapRef.current?.view?.translateYTo(-50)
      // remove keyboard shortcuts
      const shortcuts = [
        'Tab', 'Enter', 'Shift+Tab', 'Control+\u2191', 'Control+\u2193', 'Control+G',
        '/', 'Delete', 'Backspace', 'Shift+Backspace', 'Control+C', 'Control+X',
        'Control+V', 'F2', 'Shift+Enter', 'Control+Z', 'Control+Y', 'Control+A', 'Control+L'
      ]
      shortcuts.forEach(s => mindMapRef.current?.keyCommand?.removeShortcut(s))
    })

    mindMapRef.current.on('node_click', (node: any) => {
      const showConf = node?.nodeData?.data?.showConf
      if (showConf?.nodeId && onNodeClickRef.current) {
        onNodeClickRef.current(showConf.nodeId)
      }
    })

    const updateSize = () => {
      if (containerRef.current && mindMapRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          mindMapRef.current.resize(width, height)
        }
      }
    }
    window.addEventListener('resize', updateSize)
    updateSize()

    return () => {
      window.removeEventListener('resize', updateSize)
      if (mindMapRef.current) {
        mindMapRef.current.destroy()
        mindMapRef.current = null
      }
    }
  }, [])

  // Update data when it changes
  useEffect(() => {
    if (mindMapRef.current && data) {
      mindMapRef.current.updateData(data)
    }
  }, [data])

  // Update theme
  useEffect(() => {
    if (mindMapRef.current) {
      mindMapRef.current.setThemeConfig(getThemeConfig(isDark))
    }
  }, [isDark])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

const TreeDiffModal = ({ open, onClose, app, iceId, lane, registeredClasses }: Props) => {
  const { isDark } = useTheme()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [activeTree, setActiveTree] = useState<ChildrenItem | null>(null)
  const [currentTree, setCurrentTree] = useState<ChildrenItem | null>(null)
  const [changedIds, setChangedIds] = useState<Set<number>>(new Set())
  const [selectedDiff, setSelectedDiff] = useState<ChangeItem | null>(null)
  const [diffLoading, setDiffLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedDiff(null)
    setLoading(true)

    const laneParam = lane ? { lane } : {}

    Promise.all([
      apis.details({ app, iceId, address: 'server', activeOnly: true, ...laneParam }),
      apis.details({ app, iceId, address: 'server', ...laneParam }),
    ])
      .then(([activeData, currentData]) => {
        setActiveTree(activeData.root || null)
        setCurrentTree(currentData.root || null)
        // Collect changed nodeIds from the current tree
        if (currentData.root) {
          setChangedIds(collectUpdatingIds(currentData.root))
        }
      })
      .catch(() => message.error('获取树数据失败'))
      .finally(() => setLoading(false))
  }, [open, app, iceId, lane])

  const activeTreeList = useMemo(() => activeTree ? getTreeList([{ ...activeTree, isRoot: true }]) : [], [activeTree])
  const currentTreeList = useMemo(() => currentTree ? getTreeList([{ ...currentTree, isRoot: true }]) : [], [currentTree])

  const activeData = useMemo(
    () => transformWithHighlight(activeTreeList, registeredClasses, isDark, changedIds, 'left'),
    [activeTreeList, registeredClasses, isDark, changedIds]
  )
  const currentData = useMemo(
    () => transformWithHighlight(currentTreeList, registeredClasses, isDark, changedIds, 'right'),
    [currentTreeList, registeredClasses, isDark, changedIds]
  )

  const handleNodeClick = useCallback(async (nodeId: number) => {
    if (!changedIds.has(nodeId)) return
    setDiffLoading(true)
    try {
      const res = await apis.changes({ app, iceId, confId: nodeId })
      if (res.changes?.length) {
        setSelectedDiff(res.changes[0])
      }
    } catch { message.error('获取对比数据失败') }
    finally { setDiffLoading(false) }
  }, [app, iceId, changedIds])

  return (
    <Modal
      title="变更对比"
      open={open}
      onCancel={onClose}
      footer={null}
      width="100vw"
      style={{ top: 0, maxWidth: '100vw', paddingBottom: 0 }}
      styles={{ body: { height: 'calc(100vh - 55px)', padding: 0, display: 'flex', flexDirection: 'column' } }}
      destroyOnClose
    >
      {loading ? (
        <Spin style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
      ) : (
        <>
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border-secondary, #f0f0f0)' }}>
              <div style={{ padding: '4px 12px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--color-border-secondary, #f0f0f0)', background: 'var(--color-fill-quaternary, #fafafa)' }}>
                已发布 (Active)
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ReadOnlyMindMap data={activeData} isDark={isDark} onNodeClick={handleNodeClick} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '4px 12px', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--color-border-secondary, #f0f0f0)', background: 'var(--color-fill-quaternary, #fafafa)' }}>
                当前编辑 (Pending)
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ReadOnlyMindMap data={currentData} isDark={isDark} onNodeClick={handleNodeClick} />
              </div>
            </div>
          </div>
          <Modal
            title={`节点 #${selectedDiff?.confId ?? ''} 对比${selectedDiff?.active ? ' (修改)' : ' (新增)'}`}
            open={selectedDiff !== null}
            onCancel={() => setSelectedDiff(null)}
            footer={null}
            width={720}
            destroyOnClose
            centered
          >
            {diffLoading ? <Spin style={{ display: 'block', textAlign: 'center', padding: 40 }} /> :
              selectedDiff ? <NodeDiff active={selectedDiff.active} update={selectedDiff.update} /> : null
            }
          </Modal>
        </>
      )}
    </Modal>
  )
}

export default TreeDiffModal
