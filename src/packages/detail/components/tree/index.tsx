import { Tree, Modal, message, Tooltip } from 'antd'
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
        try {
          await apis.editConf({
            app,
            iceId,
            editType: 3,
            selectId: currentNode.showConf.nodeId,
            parentId: currentNode.parentId,
            nextId: currentNode.nextId,
            index: currentNode.index
          })
          refresh()
          message.success('success')
        } catch (err: any) {
          message.error(err.msg || 'server error')
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
        node.dragOver && !!RelationNodeMap.get(node.showConf.nodeType) ? 0:(dragNode.parentId === node.parentId && node.index > dragNode.index
            ? node.index
            : node.index + 1),
        moveToParentId:
          node.dragOver && !!RelationNodeMap.get(node.showConf.nodeType) ? node.showConf.nodeId : (dragNode.parentId !== node.parentId ? node.parentId : undefined)
      }
      apis
        .editConf(params)
        .then(() => {
          refresh()
          message.success('success')
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
            draggable = {{ icon: false, nodeDraggable: (node) => (
                !['r','f'].includes(String(node.key).charAt(String(node.key).length - 1))
              )}}
            onDrop={moveNode}
            treeData={treeList}
            showLine
            defaultExpandAll
            blockNode
            expandAction = {false}
            defaultSelectedKeys={[treeList[0].key]}
            onSelect={onselectedNode}
            selectedKeys={selectedNode?.key ? [selectedNode.key] : []}
            titleRender={(node) => (
              <div
                className={`tree-item ${node.isForward ? 'forward-item' : ''}`}
              >
                {node.showConf.nodeType === 5 && (
                  <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9954" width="15" height="15"><path d="M511.9233084 148.91700253l363.00630586 363.00630587-363.00630586 363.00630586-363.00630587-363.00630586 363.00630586-363.00630586m1e-8-86.91700254l-449.9233084 449.92330839 449.9233084 449.92330841 449.9233084-449.92330841-449.92330841-449.92330839z" fill="#13c41e" p-id="9955"></path></svg>
                )}
                {node.showConf.nodeType === 6 && (
                   <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8363" width="15" height="15"><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32z m-40 728H184V184h656v656z" fill="#13c41e" p-id="8364"></path></svg>
                )}
                 {node.showConf.nodeType === 7 && (
                  <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9413" width="15" height="15"><path d="M928.64 896a2.144 2.144 0 0 1-0.64 0H96a32.032 32.032 0 0 1-27.552-48.288l416-704c11.488-19.456 43.552-19.456 55.104 0l413.152 699.2A31.936 31.936 0 0 1 928.64 896zM152.064 832h719.84L512 222.912 152.064 832z" fill="#13c41e" p-id="9414"></path></svg>
                )}
                <span>{node?.showConf?.labelName}</span>
                <span className='tree-edit-wrap'>
                  {!!RelationNodeMap.get(node.showConf.nodeType) && (
                    <Tooltip title="添加子节点" color={'blue'}>
                      <PlusCircleTwoTone onClick={addChildNode} />
                    </Tooltip>
                  )}
                  {!node.forward && (
                    <Tooltip title="添加前置节点" color={'#f50'}>
                      <PlusSquareTwoTone
                        twoToneColor={'#f50'}
                        style={!!RelationNodeMap.get(node.showConf.nodeType) ? { marginLeft: 10 }:{ marginLeft: 0 }}
                        onClick={addForwardNode}
                      />
                    </Tooltip>
                  )}
                  <Tooltip title="转换节点" color={'cyan'}>
                    <ControlTwoTone
                      style={!!RelationNodeMap.get(node.showConf.nodeType) || !node.forward? { marginLeft: 10 } : { marginLeft: 0 }}
                      onClick={exchangeNode}
                    />
                  </Tooltip>
                  {!node.isRoot && (
                    <Tooltip title="删除节点" color={'red'}>
                      <DeleteOutlined
                        className='action'
                        style={{ marginLeft: 10, color: 'red' }}
                        onClick={() => deleteNode(node)}
                      />
                    </Tooltip>
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
