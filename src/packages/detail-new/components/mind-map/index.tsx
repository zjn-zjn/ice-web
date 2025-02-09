import { useEffect, useRef, useState } from 'react';
import MindMap from 'simple-mind-map';
import type { TreeItem } from '../tree';
import './index.less';
import { Modal, message } from 'antd';
import AddExchangeNodeModal from './AddExchangeNodeModal';
import apis from '../../../../apis';

interface Props {
  treeList: TreeItem[];
  refresh: () => void;
  setSelectedNode: (item: TreeItem) => void;
  selectedNode: TreeItem | undefined;
  app: string;
  iceId: string;
  address: string;
  onNodeSelect?: (node: TreeItem) => void;
}

// 转换树数据为思维导图数据
const transformTreeToMindMap = (treeItems: TreeItem[]) => {
  if (!treeItems?.length) {
    return {
      data: {
        id: 'root',
        text: 'Empty',
        expanded: true,
        isroot: true,
        direction: 2
      },
      children: []
    };
  }

  const transformNode = (item: TreeItem, level: number = 0) => {
    if (!item) return null;

    // Handle forward nodes
    if (item.forward) {
      return {
        data: {
          id: item.forward.showConf?.uniqueKey,
          text: `${item.forward.showConf?.labelName}`,
          expanded: true,
          direction: 2,
          // 保存原始数据用于事件处理
          originData: item.forward,
          isForward: true,
          showConf: item.forward.showConf,
          nextId: item.forward.nextId
        },
        children: []
      };
    }

    // Create node
    const node = {
      data: {
        id: item.key || item.showConf?.uniqueKey,
        text: `${item.text || item.showConf?.labelName}`,
        expanded: true,
        direction: 2,
        isroot: item.isRoot,
        // 保存原始数据用于事件处理
        originData: item,
        showConf: item.showConf,
        parentId: item.parentId,
        nextId: item.nextId,
        index: item.index,
        timeType: item.timeType,
        start: item.start,
        end: item.end,
        sonIds: item.sonIds,
        forwardId: item.forwardId
      },
      children: []
    };

    // Process children
    if (Array.isArray(item.children)) {
      const validChildren = item.children
        .map(child => transformNode(child, level + 1))
        .filter(child => child !== null);
      
      if (validChildren.length > 0) {
        node.children = validChildren;
      }
    }

    return node;
  };

  return transformNode(treeItems[0]);
};

// 转换思维导图节点为树节点
const transformMindMapToTree = (node: any): TreeItem | undefined => {
  if (!node?.nodeData) return undefined;
  
  const { data } = node.nodeData;
  if (!data) return undefined;

  const { showConf, isForward, isRoot, parentId, index, timeType, start, end } = data;
  
  return {
    showConf,
    isForward,
    isRoot,
    parentId,
    index,
    timeType,
    start,
    end,
    key: showConf?.uniqueKey,
    text: showConf?.labelName,
    children: []
  } as TreeItem;
};

const MindMapComponent = ({
  treeList,
  refresh,
  setSelectedNode,
  selectedNode,
  app,
  iceId,
  address
}: Props) => {
  const mindMapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [addExchangeNodeModalObj, setAddExchangeNodeModalObj] = useState({
    visible: false,
    modalType: 'child'
  });

  // 初始化选中第一个节点
  useEffect(() => {
    if (treeList?.length > 0 && !selectedNode) {
      setSelectedNode(treeList[0]);
    }
  }, [treeList]);

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
          });
          refresh();
          message.success('success');
        } catch (err: any) {
          message.error(err.msg || 'server error');
        }
      }
    });
  };

  // 添加子节点
  const addChildNode = () => {
    setAddExchangeNodeModalObj({
      visible: true,
      modalType: 'child'
    });
  };

  // 添加前置节点
  const addForwardNode = () => {
    setAddExchangeNodeModalObj({
      visible: true,
      modalType: 'front'
    });
  };

  // 转换节点
  const exchangeNode = () => {
    setAddExchangeNodeModalObj({
      visible: true,
      modalType: 'exchange'
    });
  };

  useEffect(() => {
    if (containerRef.current && treeList?.length) {
      const updateSize = () => {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          if (width > 0 && height > 0 && mindMapRef.current) {
            mindMapRef.current.resize(width, height);
          }
        }
      };

      mindMapRef.current = new MindMap({
        el: containerRef.current,
        data: transformTreeToMindMap(treeList),
        layout: 'logicalStructure',
        layoutDirection: 2,
        theme: {
          lineWidth: 1,
          lineColor: '#d9d9d9',
          lineStyle: 'straight',
          generalizationLineWidth: 0,
          renderNodeContent: (node: any) => {
            const { showConf, isForward } = node.data;
            const nodeType = showConf?.nodeType;
            
            let iconSvg = '';
            if (nodeType === 5) {
              iconSvg = '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="15" height="15"><path d="M511.9233084 148.91700253l363.00630586 363.00630587-363.00630586 363.00630586-363.00630587-363.00630586 363.00630586-363.00630586m1e-8-86.91700254l-449.9233084 449.92330839 449.9233084 449.92330841 449.9233084-449.92330841-449.92330841-449.92330839z" fill="#13c41e"></path></svg>';
            } else if (nodeType === 6) {
              iconSvg = '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="15" height="15"><path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32z m-40 728H232V137h302v216a42 42 0 0042 42h216v494z"></path></svg>';
            } else if (nodeType === 7) {
              iconSvg = '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="15" height="15"><path d="M928.64 896a2.144 2.144 0 0 1-0.64 0H96a32.032 32.032 0 0 1-27.552-48.288l416-704c11.488-19.456 43.552-19.456 55.104 0l413.152 699.2A31.936 31.936 0 0 1 928.64 896zM152.064 832h719.84L512 222.912 152.064 832z" fill="#13c41e"></path></svg>';
            }

            const buttons = [];
            if (RelationNodeMap.get(showConf?.nodeType)) {
              buttons.push(`
                <span class="tree-btn add-child" title="添加子节点">
                  <svg viewBox="64 64 896 896" width="14" height="14" fill="#1677ff">
                    <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path>
                    <path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path>
                  </svg>
                </span>
              `);
            }
            
            if (!isForward) {
              buttons.push(`
                <span class="tree-btn add-forward" title="添加前置节点" style="margin-left: 4px;">
                  <svg viewBox="64 64 896 896" width="14" height="14" fill="#ff4d4f">
                    <path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137h302v216a42 42 0 0042 42h216v494z"></path>
                  </svg>
                </span>
              `);
            }

            if (!isForward) {
              buttons.push(`
                <span class="tree-btn exchange" title="转换节点" style="margin-left: 4px;">
                  <svg viewBox="64 64 896 896" width="14" height="14" fill="#1677ff">
                    <path d="M847.9 592H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h605.2L612.9 851c-4.1 5.2-.4 13 6.3 13h72.5c4.9 0 9.5-2.2 12.6-6.1l168.8-214.1c16.5-21 1.6-51.8-25.2-51.8zM872 356H266.8l144.3-183c4.1-5.2.4-13-6.3-13h-72.5c-4.9 0-9.5 2.2-12.6 6.1L150.9 380.2c-16.5 21-1.6 51.8 25.2 51.8h696c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"></path>
                  </svg>
                </span>
              `);
            }

            buttons.push(`
              <span class="tree-btn delete" title="删除节点" style="margin-left: 4px;">
                <svg viewBox="64 64 896 896" width="14" height="14" fill="#ff4d4f">
                  <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
                </svg>
              </span>
            `);

            return `
              <div class="tree-item ${isForward ? 'forward-item' : ''}" style="display: flex; align-items: center; gap: 4px;">
                ${iconSvg}
                <span>${node.data.text}</span>
                <span class="tree-edit-wrap" style="margin-left: 8px;">
                  ${buttons.join('')}
                </span>
              </div>
            `;
          },
          root: {
            fillColor: '#fff',
            borderColor: '#d9d9d9',
            borderWidth: 1,
            borderRadius: 3,
            fontSize: 14,
            color: 'rgba(0, 0, 0, 0.85)',
            padding: [4, 8, 4, 8],
            active: {
              borderColor: '#1890ff',
              borderWidth: 2,
            }
          },
          second: {
            fillColor: '#fff',
            borderColor: '#d9d9d9',
            borderWidth: 1,
            borderRadius: 3,
            fontSize: 14,
            color: 'rgba(0, 0, 0, 0.85)',
            padding: [4, 8, 4, 8],
            active: {
              borderColor: '#1890ff',
              borderWidth: 2,
            }
          },
          node: {
            fillColor: '#fff',
            borderColor: '#d9d9d9',
            borderWidth: 1,
            borderRadius: 3,
            fontSize: 14,
            color: 'rgba(0, 0, 0, 0.85)',
            padding: [4, 8, 4, 8],
            active: {
              borderColor: '#1890ff',
              borderWidth: 2,
            }
          }
        },
      });

      // 注册节点点击事件
      mindMapRef.current.on('node_click', (node: any) => {
        const treeNode = transformMindMapToTree(node);
        console.log('clicked node:', node);
        console.log('transformed tree node:', treeNode);
        if (treeNode) {
          setSelectedNode(treeNode);
        }
      });

      // 注册按钮点击事件
      containerRef.current.addEventListener('click', (e: any) => {
        const target = e.target as HTMLElement;
        const button = target.closest('.tree-btn');
        if (button) {
          e.stopPropagation();
          const node = mindMapRef.current.renderer.activeNode;
          if (!node) return;

          const treeNode = transformMindMapToTree(node);
          if (!treeNode) return;

          if (button.classList.contains('add-child')) {
            addChildNode();
          } else if (button.classList.contains('add-forward')) {
            addForwardNode();
          } else if (button.classList.contains('exchange')) {
            exchangeNode();
          } else if (button.classList.contains('delete')) {
            deleteNode(treeNode);
          }
        }
      });

      // 注册节点拖动事件
      mindMapRef.current.on('node_drag', (node: any, parent: any) => {
        // 非server 不可移动
        if (!!address && address !== 'server') {
          return;
        }
        // 前置节点不可移动
        if (node.data.isForward) {
          return;
        }
        // 不可移动到根节点、前置节点的位置
        const targetNode = transformMindMapToTree(parent);
        if (!targetNode || targetNode.isRoot || targetNode.isForward) {
          return;
        }

        const sourceNode = transformMindMapToTree(node);
        if (!sourceNode) return;

        const params = {
          app,
          iceId,
          editType: 6,
          parentId: sourceNode.parentId,
          selectId: sourceNode.showConf.nodeId,
          index: sourceNode.index,
          moveTo: 0,
          moveToParentId: targetNode.showConf.nodeId
        };

        apis.editConf(params)
          .then(() => {
            refresh();
            message.success('success');
          })
          .catch((err: any) => {
            message.error(err.msg || 'server error');
          });
      });

      // 监听窗口大小变化
      window.addEventListener('resize', updateSize);
      // 初始化大小
      updateSize();

      return () => {
        window.removeEventListener('resize', updateSize);
        if (mindMapRef.current) {
          mindMapRef.current.destroy();
        }
      };
    }
  }, [treeList, containerRef.current]);

  return (
    <>
      <div ref={containerRef} className="mind-map-container" />
      <AddExchangeNodeModal
        visible={addExchangeNodeModalObj.visible}
        modalType={addExchangeNodeModalObj.modalType}
        onCancel={() => setAddExchangeNodeModalObj({ visible: false, modalType: 'child' })}
        onOk={() => {
          setAddExchangeNodeModalObj({ visible: false, modalType: 'child' });
          refresh();
        }}
        app={app}
        iceId={iceId}
        address={address}
        currentNode={selectedNode}
      />
    </>
  );
};

export default MindMapComponent;
