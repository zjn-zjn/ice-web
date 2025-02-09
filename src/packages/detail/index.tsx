import apis from '../../apis'
import { useRequest } from 'ahooks'
import Tree, { TreeItem } from './components/tree'
import Edit from './components/edit'
import { useCallback, useMemo, useState } from 'react'
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

  const { data, run } = useRequest<
    {
      data: DetailData
    },
    any[]
  >(() => apis.details({ app, iceId, address }), {
    refreshDeps: [app, iceId, address]
  })

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
    console.log('root:', root)
    const result = root ? getTreeList([{ ...root, isRoot: true }]) : []
    console.log('treeList:', JSON.stringify(result, null, 2))
    return result
  }, [data?.root])

  const selectOptions = useMemo(() => {
    return [
      { label: 'Server', value: 'server' },
      ...(data?.data?.registerClients || []).map((item) => ({
        label: item,
        value: item
      }))
    ]
  }, [data?.data?.registerClients])

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
    <>
      <div className='detail-wrap'>
        <Space className='operation-wrap'>
          <Select
            style={{ width: 220 }}
            options={selectOptions}
            value={address}
            onChange={(v) => {
              setAddress(v)
            }}
          />
          <Button type='primary' onClick={release}>
            发布
          </Button>
          <Button type='primary' danger onClick={clean}>
            清除
          </Button>
          <Button onClick={openImportModal}>导入</Button>
          <Button onClick={openExportModal}>导出</Button>
        </Space>
        <Tree
          treeList={treeList}
          refresh={run}
          setSelectedNode={setSelectedNode}
          selectedNode={selectedNode}
          app={app}
          iceId={iceId}
          address={address}
        />
        <Edit
          selectedNode={selectedNode}
          address={address}
          app={app}
          iceId={iceId}
          refresh={run}
        />
      </div>
      <ImportModal
        open={importVisible}
        onCancel={() => {
          setImportVisible(false)
        }}
        onOk={() => {
          setImportVisible(false)
          run()
        }}
        app={app}
      />
      <ExportModal
        open={exportVisible}
        iceId={iceId}
        onCancel={() => {
          setExportVisible(false)
        }}
        onOk={() => {
          setExportVisible(false)
        }}
        app={app}
      />
    </>
  )
}

export default Detail
