import { useParams } from 'react-router-dom'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import Tree, { TreeItem } from './components/tree'
import Edit from './components/edit'
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Select, Space } from 'antd'
import './index.less'

const Detail = () => {
  const { app, iceId } = useParams<{ app: string; iceId: string }>() || {}
  const [selectedNode, setSelectedNode] = useState<TreeItem>()
  const [address, setAddress] = useState('server')

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

  return (
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
        {/* TODO  */}
        {/* <Button type='primary'>发布</Button>
        <Button type='primary' danger>
          清除
        </Button>
        <Button>导入</Button>
        <Button>导出</Button> */}
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
  )
}

export default Detail
