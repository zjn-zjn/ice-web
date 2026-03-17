import apis from '../../apis'
import { useRequest } from 'ahooks'
import type { TreeItem } from './types'
import type { DetailData, ChildrenItem } from '../../index.d'
import MindMapComponent from './components/mind-map'
import Edit from './components/edit'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { Button, Select, Space, Modal, message } from 'antd'
import ImportModal from '../config-list/components/import-modal'
import ExportModal from '../config-list/components/export-modal'
import { useLocation, useNavigate } from 'react-router-dom'
import './index.less'

const Detail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const iceId = searchParams.get('iceId') || ''
  const app = searchParams.get('app') || ''
  const urlLane = searchParams.get('lane')

  const getInitialLane = () => {
    if (urlLane) return urlLane
    if (app) {
      const saved = sessionStorage.getItem(`ice_lane_${app}`)
      if (saved) return saved
    }
    return undefined
  }

  const [selectedNode, setSelectedNode] = useState<TreeItem>()
  const [address, setAddress] = useState('server')
  const [importVisible, setImportVisible] = useState(false)
  const [exportVisible, setExportVisible] = useState(false)
  const [editCollapsed, setEditCollapsed] = useState(false)
  const [selectedLane, setSelectedLane] = useState<string | undefined>(getInitialLane)

  useEffect(() => {
    const lane = getInitialLane()
    setSelectedLane(lane)
    if (lane && !urlLane) {
      const params = new URLSearchParams(location.search)
      params.set('lane', lane)
      navigate(`${location.pathname}?${params.toString()}`, { replace: true })
    }
  }, [iceId])

  const { data, run } = useRequest<DetailData, any>(
    () => apis.details({ app, iceId, address, ...(selectedLane ? { lane: selectedLane } : {}) } as any),
    {
      refreshDeps: [app, iceId, address, selectedLane]
    }
  )

  const { data: lanes } = useRequest<string[], any[]>(
    () => apis.getLanes({ app }),
    { refreshDeps: [app] }
  )

  const onLaneChange = (value: string | undefined) => {
    setSelectedLane(value)
    const params = new URLSearchParams(location.search)
    if (value) {
      params.set('lane', value)
      sessionStorage.setItem(`ice_lane_${app}`, value)
    } else {
      params.delete('lane')
      sessionStorage.removeItem(`ice_lane_${app}`)
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true })
  }

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
    const root = data?.root
    const result = root ? getTreeList([{ ...root, isRoot: true }]) : []
    return result
  }, [data?.root])

  const selectOptions = useMemo(() => {
    return [
      { label: 'Server', value: 'server' },
      ...(data?.registerClients || []).map((item: string) => ({
        label: item,
        value: item
      }))
    ]
  }, [data?.registerClients])

  const openExportModal = () => {
    setExportVisible(true)
  }

  const openImportModal = () => {
    setImportVisible(true)
  }

  const release = () => {
    Modal.confirm({
      title: '确认发布所有变更吗？',
      onOk: async () => {
        try {
          await apis.release({
            app,
            iceId
          })
          run()
          message.success('success')
        } catch (err: any) {
          message.error(err.msg || 'server error')
        }
      }
    })
  }

  const clean = () => {
    Modal.confirm({
      title: '确认清除所有变更吗？',
      onOk: async () => {
        try {
          await apis.updateClean({
            app,
            iceId
          })
          run()
          message.success('success')
        } catch (err: any) {
          message.error(err.msg || 'server error')
        }
      }
    })
  }

  return (
    <div className='detail-wrap'>
      <div className='operation-wrap'>
        <Space>
          <Select
            value={address}
            onChange={setAddress}
            style={{ width: 200 }}
            options={selectOptions}
          />
          {lanes && lanes.length > 0 && (
            <Select
              allowClear
              placeholder="泳道: 主干"
              value={selectedLane}
              onChange={onLaneChange}
              style={{ width: 160 }}
              options={lanes.map((l) => ({ label: l, value: l }))}
            />
          )}
          <Button onClick={openImportModal}>导入</Button>
          <Button onClick={openExportModal}>导出</Button>
          <Button onClick={release}>发布</Button>
          <Button onClick={clean}>清除</Button>
        </Space>
      </div>
      <MindMapComponent
        treeList={treeList}
        refresh={run}
        setSelectedNode={setSelectedNode}
        selectedNode={selectedNode}
        app={app}
        iceId={iceId}
        address={address}
        lane={selectedLane}
      />
      <div className={`edit-wrap ${editCollapsed ? 'collapsed' : ''}`}>
        <div className="edit-collapse-btn" onClick={() => setEditCollapsed(!editCollapsed)}>
          {editCollapsed ? '<' : '>'}
        </div>
        {!editCollapsed && (
          <Edit
            app={app}
            iceId={iceId}
            address={address}
            refresh={run}
            selectedNode={selectedNode}
          />
        )}
      </div>
      <ImportModal
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        onOk={() => {
          setImportVisible(false)
          run()
        }}
        app={app}
      />
      <ExportModal
        open={exportVisible}
        onCancel={() => setExportVisible(false)}
        onOk={() => {
          setExportVisible(false)
        }}
        app={app}
        iceId={iceId}
      />
    </div>
  )
}

export default Detail
