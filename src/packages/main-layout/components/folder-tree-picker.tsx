import { useState, useMemo, useEffect } from 'react'
import { Modal, Tree } from 'antd'
import { FolderOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import apis from '../../../apis'
import type { FolderTreeNode } from '../../../index.d'

interface Props {
  open: boolean
  appId: number
  onCancel: () => void
  onOk: (targetPath: string) => void
}

interface TreeDataNode {
  key: string
  title: string
  icon: React.ReactNode
  children: TreeDataNode[]
}

const buildTreeData = (nodes: FolderTreeNode[]): TreeDataNode[] => {
  return nodes.map(n => ({
    key: n.path,
    title: n.name,
    icon: <FolderOutlined style={{ color: '#faad14' }} />,
    children: buildTreeData(n.children || [])
  }))
}

const FolderTreePicker = ({ open, appId, onCancel, onOk }: Props) => {
  const [selectedPath, setSelectedPath] = useState<string>('')

  const { data, run } = useRequest(
    () => apis.folderTree({ app: appId }),
    { manual: true }
  )

  useEffect(() => {
    if (open) {
      run()
      setSelectedPath('')
    }
  }, [open, run])

  const treeData = useMemo((): TreeDataNode[] => {
    const root: TreeDataNode = {
      key: '',
      title: '/ (根目录)',
      icon: <FolderOutlined style={{ color: '#faad14' }} />,
      children: buildTreeData(data || [])
    }
    return [root]
  }, [data])

  return (
    <Modal
      title="移动"
      open={open}
      onCancel={onCancel}
      onOk={() => onOk(selectedPath)}
      className="folder-tree-modal"
      okText="确定移动"
    >
      <Tree
        showIcon
        defaultExpandAll
        treeData={treeData}
        selectedKeys={[selectedPath]}
        onSelect={(keys) => {
          if (keys.length > 0) {
            setSelectedPath(keys[0] as string)
          }
        }}
      />
    </Modal>
  )
}

export default FolderTreePicker
