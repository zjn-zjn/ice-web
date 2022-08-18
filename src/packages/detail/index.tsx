import { useParams } from 'react-router-dom'
import apis from '../../apis'
import { useRequest } from 'ahooks'
import qs from 'qs'
import Tree, { TreeItem } from './components/tree'
import Edit from './components/edit'
import { useCallback, useMemo } from 'react'
import './index.less'

const DetailList = () => {
  const { app, iceId } = useParams<{ app: string; iceId: string }>() || {}
  const address = qs.parse(window.location.search.split(`?`)[1]).addr as string

  const { data, run } = useRequest<
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
          title: <div className='tree-item'>{showConf?.labelName}</div>,
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
      <Tree treeList={treeList} />
      <Edit />
    </div>
  )
}

export default DetailList
