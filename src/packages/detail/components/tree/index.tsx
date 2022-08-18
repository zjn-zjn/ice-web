import { Tree } from 'antd'

export interface TreeItem extends Omit<ChildrenItem, 'children'> {
  key: string
  title: JSX.Element
  children: TreeItem[]
}

interface Props {
  treeList: TreeItem[]
}

const TreeArea = ({ treeList }: Props) => {
  return (
    <div className='tree-wrap'>
      {treeList.length && (
        <Tree
          treeData={treeList}
          showLine
          defaultExpandAll
          // selectedKeys={selectedKeys}
          // defaultExpandedKeys={defaultExpandedKeys}
          // defaultSelectedKeys={defaultExpandedKeys}
          // draggable
          // blockNode
          // onDrop={onDrop}
        />
      )}
    </div>
  )
}

export default TreeArea
