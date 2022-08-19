import { useParams } from 'react-router-dom'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import qs from 'qs'
import Tree, { TreeItem } from './components/tree'
import Edit from './components/edit'
import { useCallback, useMemo, useState } from 'react'
import './index.less'

const Detail = () => {
  const { app, iceId } = useParams<{ app: string; iceId: string }>() || {}
  const address = qs.parse(window.location.search.split(`?`)[1]).addr as string
  const [selectNode, setSelectNode] = useState<TreeItem>()

  const { data, refresh } = useRequest<
    {
      data: DetailData
    },
    any[]
  >(() => apis.details({ app, iceId, address }))

  const getTreeList = useCallback(
    (list: ChildrenItem[]): TreeItem[] =>
      list.map((item) => {
        const { children = [], showConf, ...reset } = item
        return {
          ...reset,
          showConf,
          key: `${showConf?.nodeId}`,
          children: getTreeList(children)
        }
      }),
    []
  )

  const treeList = useMemo(() => {
    const root = data?.data.root
    return root ? getTreeList([root]) : []
  }, [data?.data.root])

  return (
    <div className='detail-wrap'>
      <Tree
        treeList={treeList}
        refresh={refresh}
        setSelectNode={setSelectNode}
      />
      <Edit
        selectNode={selectNode}
        address={address}
        app={app}
        iceId={iceId}
        refresh={refresh}
      />
    </div>
  )
}

export default Detail
