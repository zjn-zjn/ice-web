import { useParams } from 'react-router-dom'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import Tree, { TreeItem } from './components/tree'
import Edit from './components/edit'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Select, Space, Modal, message } from 'antd'
import ImportModal from '../config-list/components/import-modal'
import ExportModal from '../config-list/components/export-modal'

import './index.less'

const Detail = () => {
  const { app, iceId } = useParams<{ app: string; iceId: string }>() || {}
  const [selectedNode, setSelectedNode] = useState<TreeItem>()
  const [address, setAddress] = useState('server')
  const [importVisible, setImportVisible] = useState(false)
  const [exportVisible, setExportVisible] = useState(false)

  const { data, refresh } = useRequest<
    {
      data: DetailData
    },
    any[]
  >(() => apis.details({ app, iceId, address }), {
    manual: true
  })

  const getTreeList = useCallback(
    (list: ChildrenItem[]): TreeItem[] =>
      list.map((item) => {
        const { children = [], showConf, ...reset } = item
        return {
          ...reset,
          showConf,
          key: `${showConf?.nodeId}`,
          disabled: item.isForward,
          children: getTreeList([
            ...(item.forward ? [{ ...item.forward, isForward: true }] : []),
            ...children
          ])
        }
      }),
    []
  )

  const treeList = useMemo(() => {
    const root = data?.data.root
    return root ? getTreeList([{ ...root, isRoot: true }]) : []
  }, [data?.data.root])

  const selectOptions = useMemo(() => {
    return [
      { label: 'Server', value: 'server' },
      ...(data?.data?.registerClients || []).map((item) => ({
        label: item,
        value: item
      }))
    ]
  }, [data?.data?.registerClients])

  useEffect(() => {
    refresh()
  }, [address])

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
        const res: any = await apis
          .release({
            app,
            iceId
          })
          .catch((err: any) => {
            message.error(err.msg || 'server error')
          })
        if (res?.ret === 0) {
          message.success('success')
        } else {
          message.error(res?.msg || 'failed')
        }
      }
    })
  }

  const clean = () => {
    Modal.confirm({
      title: '确认清除所有变更吗？',
      onOk: async () => {
        const res: any = await apis
          .updateClean({
            app,
            iceId
          })
          .catch((err: any) => {
            message.error(err.msg || 'server error')
          })
        if (res?.ret === 0) {
          message.success('success')
        } else {
          message.error(res?.msg || 'failed')
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
          refresh={refresh}
          setSelectedNode={setSelectedNode}
          selectedNode={selectedNode}
          app={app}
          iceId={iceId}
        />
        <Edit
          selectedNode={selectedNode}
          address={address}
          app={app}
          iceId={iceId}
          refresh={refresh}
        />
      </div>
      <ImportModal
        visible={importVisible}
        closeModal={() => {
          setImportVisible(false)
        }}
      />
      <ExportModal
        visible={exportVisible}
        iceId={iceId}
        closeModal={() => {
          setExportVisible(false)
        }}
      />
    </>
  )
}

export default Detail
