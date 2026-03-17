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
import { useLocation } from 'react-router-dom'
import './index.less'

const Detail = () => {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const iceId = searchParams.get('iceId') || ''
  const app = searchParams.get('app') || ''
  const [selectedNode, setSelectedNode] = useState<TreeItem>()
  const [address, setAddress] = useState('server')
  const [importVisible, setImportVisible] = useState(false)
  const [exportVisible, setExportVisible] = useState(false)
  const [editCollapsed, setEditCollapsed] = useState(false)
  const [selectedLane, setSelectedLane] = useState<string | undefined>(undefined)

  const { data, run } = useRequest<DetailData, any>(
    () => apis.details({ app, iceId, address} as any),
    {
      refreshDeps: [app, iceId, address]
    }
  )

  const { data: lanes } = useRequest<string[], any[]>(
    () => apis.getLanes({ app }),
    { refreshDeps: [app] }
  )

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
              onChange={setSelectedLane}
              style={{ width: 160 }}
              options={lanes.map((l) => ({ label: `泳道: ${l}`, value: l }))}
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
