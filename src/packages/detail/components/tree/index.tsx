import { Tree } from 'antd'
import { useEffect, useRef } from 'react'

export interface TreeItem extends Omit<ChildrenItem, 'children'> {
  key: string
  children: TreeItem[]
}

interface Props {
  treeList: TreeItem[]
  refresh: () => void
  setSelectNode: (item: TreeItem) => void
}

const TreeArea = ({ treeList, setSelectNode }: Props) => {
  const initSelectRef = useRef(false)

  useEffect(() => {
    if (!initSelectRef.current && treeList.length > 0) {
      setSelectNode(treeList[0])
      initSelectRef.current = true
    }
  }, [treeList])

  // 删除节点
  const deleteNode = () => {}

  // 移动节点
  const moveNode = () => {}

  // 添加子节点
  const addChildNode = () => {}

  // 选择节点
  const selectNode = (
    selectedKeys: any[],
    e: {
      selected: boolean
      selectedNodes: TreeItem[]
    }
  ) => {
    if (e.selected) {
      setSelectNode(e.selectedNodes[0])
    }
  }

  return (
    <div className='tree-wrap'>
      {treeList.length && (
        <Tree<TreeItem>
          treeData={treeList}
          showLine
          defaultExpandAll
          blockNode
          defaultSelectedKeys={[treeList[0].key]}
          onSelect={selectNode}
          titleRender={(node) => (
            <div className='tree-item'>{node?.showConf?.labelName}</div>
          )}
          // draggable
          // onDrop={onDrop}
        />
      )}
    </div>
  )
}

export default TreeArea
