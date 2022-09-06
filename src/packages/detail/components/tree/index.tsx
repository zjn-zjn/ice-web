import { Tree, Modal, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import {
  PlusCircleTwoTone,
  ControlTwoTone,
  PlusSquareTwoTone,
  DeleteOutlined
} from '@ant-design/icons'
import AddExchangeNodeModal from './components/addExchangeNodeModal'
import apis from '../../../../apis'
import { EventDataNode } from 'antd/lib/tree'
import { RelationNodeMap } from './constant'

export interface TreeItem extends Omit<ChildrenItem, 'children'> {
  key: string
  children: TreeItem[]
}

interface Props {
  treeList: TreeItem[]
  refresh: () => void
  setSelectedNode: (item: TreeItem) => void
  selectedNode: TreeItem | undefined
  app: string
  iceId: string
  address: string
}

const TreeArea = ({
  treeList,
  setSelectedNode,
  selectedNode,
  app,
  refresh,
  iceId,
  address
}: Props) => {
  const initSelectRef = useRef(false)
  const [addExchangeNodeModalObj, setAddExchangeNodeModalObj] = useState({
    visible: false,
    modalType: 'child'
  })

  useEffect(() => {
    if (!initSelectRef.current && treeList.length > 0) {
      setSelectedNode(treeList[0])
      initSelectRef.current = true
    }
  }, [treeList])

  // 删除节点
  const deleteNode = (currentNode: TreeItem) => {
    Modal.confirm({
      title: `确认删除<${currentNode.showConf.labelName}>节点吗？`,
      onOk: async () => {
        const res: any = await apis
          .editConf({
            app,
            iceId,
            editType: 3,
            selectId: currentNode.showConf.nodeId,
            parentId: currentNode.parentId,
            nextId: currentNode.nextId,
            index: currentNode.index
          })
          .catch((err: any) => {
            message.error(err.msg || 'server error')
          })
        if (res?.ret === 0) {
          refresh()
          message.success('success')
        } else {
          message.error(res?.msg || 'failed')
        }
      }
    })
  }

  // 添加子节点
  const addChildNode = () => {
    setAddExchangeNodeModalObj({
      visible: true,
      modalType: 'child'
    })
  }

  // 添加前置节点
  const addForwardNode = () => {
    setAddExchangeNodeModalObj({
      visible: true,
      modalType: 'front'
    })
  }

  // 转换节点
  const exchangeNode = () => {
    setAddExchangeNodeModalObj({
      visible: true,
      modalType: 'exchange'
    })
  }

  // 选择节点
  const onselectedNode = (
    selectedKeys: any[],
    e: {
      selected: boolean
      selectedNodes: TreeItem[]
    }
  ) => {
    if (e.selected) {
      setSelectedNode(e.selectedNodes[0])
    }
  }

  // 移动节点
  const moveNode = ({
    dragNode,
    node
  }: {
    dragNode: EventDataNode<TreeItem>
    dragNodesKeys: any[]
    dropPosition: number
    dropToGap: boolean
    node: TreeItem
  }) => {
    // 非server 不可移动
    if (!!address && address !== 'server') {
      return
    }
    // 前置节点不可移动
    if (dragNode.isForward) {
      return
    }
    // 不可移动到根节点、前置节点的位置
    const canMove = !node.isRoot && !node.isForward
    if (canMove) {
      const params = {
        app,
        iceId,
        editType: 6,
        parentId: dragNode.parentId,
        selectId: dragNode.showConf.nodeId,
        index: dragNode.index,
        moveTo:
          dragNode.parentId === node.parentId && node.index > dragNode.index
            ? node.index
            : node.index + 1,
        moveToParentId:
          dragNode.parentId !== node.parentId ? node.parentId : undefined
      }
      apis
        .editConf(params)
        .then((res: any) => {
          if (res?.ret === 0) {
            refresh()
            message.success('success')
          } else {
            message.error(res?.msg || 'failed')
          }
        })
        .catch((err: any) => {
          message.error(err.msg || 'server error')
        })
    }
  }

  return (
    <>
      <div className='tree-wrap'>
        {treeList.length ? (
          <Tree<TreeItem>
            draggable
            onDrop={moveNode}
            treeData={treeList}
            showLine
            defaultExpandAll
            blockNode
            defaultSelectedKeys={[treeList[0].key]}
            onSelect={onselectedNode}
            selectedKeys={selectedNode?.key ? [selectedNode.key] : []}
            titleRender={(node) => (
              <div
                className={`tree-item ${node.isForward ? 'forward-item' : ''}`}
              >
                <span>{node?.showConf?.labelName}</span>
                <span className='tree-edit-wrap'>
                  {!!RelationNodeMap.get(node.showConf.nodeType) && (
                    <PlusCircleTwoTone onClick={addChildNode} />
                  )}
                  {!node.forward && (
                    <PlusSquareTwoTone
                      style={{ marginLeft: 10 }}
                      onClick={addForwardNode}
                    />
                  )}
                  <ControlTwoTone
                    style={{ marginLeft: 10 }}
                    onClick={exchangeNode}
                  />
                  {!node.isRoot && (
                    <DeleteOutlined
                      className='action'
                      style={{ marginLeft: 10, color: 'red' }}
                      onClick={() => deleteNode(node)}
                    />
                  )}
                </span>
              </div>
            )}
          />
        ) : null}
      </div>
      <AddExchangeNodeModal
        selectedNode={selectedNode}
        refresh={refresh}
        app={app}
        iceId={iceId}
        closeModal={() => {
          setAddExchangeNodeModalObj((pre) => ({ ...pre, visible: false }))
        }}
        {...addExchangeNodeModalObj}
      />
    </>
  )
}

export default TreeArea
