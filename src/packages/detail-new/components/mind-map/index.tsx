import { useEffect, useRef, useState } from 'react';
import MindMap from 'simple-mind-map';
import type { TreeItem } from '../tree';
import './index.less';
import { Modal, message, Tooltip } from 'antd';
import AddExchangeNodeModal from './AddExchangeNodeModal';
import apis from '../../../../apis';
import {
  PlusCircleTwoTone,
  ControlTwoTone,
  PlusSquareTwoTone,
  DeleteOutlined
} from '@ant-design/icons';
import { RelationNodeMap } from '../tree/constant';

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
const transformTreeToMindMap = (treeItems: TreeItem[]): any => {
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

  const transformNode = (item: TreeItem, level: number = 0): any => {
    if (!item) return null;

    // console.log('Transform node:', item);
    // console.log('Is forward?', item.isForward);

    // Create node
    const node = {
      data: {
        id: item.key || item.showConf?.uniqueKey,
        text: `${item.text || item.showConf?.labelName}`,
        expanded: true,
        direction: 2,
        isroot: item.isRoot,
        originData: item,
        showConf: item.showConf,
        parentId: item.parentId,
        nextId: item.nextId,
        index: item.index,
        timeType: item.timeType,
        start: item.start,
        end: item.end,
        sonIds: item.sonIds,
        forwardId: item.forwardId,
        isForward: item.isForward,
        forward: item.forward,
        color: item.isForward ? '#f50' : undefined,
        borderColor: item.isForward ? '#f50' : undefined
      },
      children: []
    };

    // console.log('Created node:', node);

    // Process children
    if (Array.isArray(item.children)) {
      const validChildren = item.children
        .map(child => transformNode(child, level + 1))
        .filter(child => child !== null);
      
      if (validChildren.length > 0) {
        node.children.push(...validChildren);
      }
    }

    return node;
  };

  const rootNode = transformNode(treeItems[0]);
  // console.log('Final root node:', rootNode);
  return rootNode;
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

  useEffect(() => {
    if (!containerRef.current || !treeList?.length) return;

    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0 && mindMapRef.current) {
          mindMapRef.current.resize(width, height);
        }
      }
    };

    const mindMapData = transformTreeToMindMap(treeList);
    console.log('Mind Map Data:', mindMapData);

    const customTheme = {
      backgroundColor: '#fafafa',
      lineWidth: 1,
      lineColor: '#959da5',
      generalizationLineWidth: 1,
      generalizationLineColor: '#959da5',
      
      root: {
        shape: 'rectangle',
        marginX: 50,
        marginY: 0,
        fillColor: '#f6f6f6',
        fontFamily: '微软雅黑, Microsoft YaHei',
        color: '#333',
        fontSize: 16,
        fontWeight: 600,
        borderWidth: 1,
        borderColor: '#c7ccd1',
        borderStyle: 'solid',
        borderRadius: 4,
        padding: [15, 15, 15, 15]
      },
      
      second: {
        shape: 'rectangle',
        marginX: 100,
        marginY: 40,
        fillColor: '#fff',
        fontFamily: '微软雅黑, Microsoft YaHei',
        color: '#333',
        fontSize: 14,
        fontWeight: 400,
        borderWidth: 1,
        borderColor: '#c7ccd1',
        borderStyle: 'solid',
        borderRadius: 4,
        padding: [10, 10, 10, 10]
      },
      
      node: {
        shape: 'rectangle',
        marginX: 50,
        marginY: 0,
        fillColor: '#fff',
        fontFamily: '微软雅黑, Microsoft YaHei',
        color: '#333',
        fontSize: 14,
        fontWeight: 400,
        borderWidth: 1,
        borderColor: '#c7ccd1',
        borderStyle: 'solid',
        borderRadius: 4,
        padding: [10, 10, 10, 10]
      }
    };

    mindMapRef.current = new MindMap({
      el: containerRef.current.querySelector('.mind-map-container'),
      data: mindMapData,
      layout: 'logicalStructure',
      direction: 2,
      themeConfig: customTheme
    });

    // 监听渲染完成事件
    mindMapRef.current.on('node_tree_render_end', () => {
      console.log('11. === node_tree_render_end ===');
      if (mindMapRef.current) {
        console.log('12. Mind map instance:', mindMapRef.current);
        
        const renderer = mindMapRef.current.renderer;
        if (renderer) {
          console.log('13. Renderer:', renderer);
          console.log('14. Render tree:', renderer.renderTree);
          
          // 递归更新节点样式
          const updateNodeStyle = (node: any) => {
            if (!node || !node._node) return;
            
            console.log('15. Updating node style:', {
              data: node.data,
              isForward: node.data.isForward,
              node: node._node
            });

            // 如果是转发节点，更新样式
            if (node.data.isForward) {
              const textElement = node._node.querySelector('text');
              const rectElement = node._node.querySelector('rect');
              
              if (textElement) {
                textElement.style.fill = '#f50';
              }
              
              if (rectElement) {
                rectElement.style.stroke = '#f50';
              }
            }

            // 递归处理子节点
            node.children?.forEach((child: any) => updateNodeStyle(child));
          };

          updateNodeStyle(renderer.renderTree);
        }
      }
      console.log('16. ========================');
    });

    // 注册节点点击事件
    mindMapRef.current.on('node_click', (node: any) => {
      const treeNode = transformMindMapToTree(node);
      if (!treeNode) return;
      setSelectedNode(treeNode);
    });

    // 注册节点 hover 事件
    mindMapRef.current.on('node_mouseenter', (node: any, e: any) => {
      const nodeEl = e.target;

      // 如果已经有按钮组，就不重复创建
      if (nodeEl.querySelector('.node-buttons')) {
        const buttons = nodeEl.querySelector('.node-buttons');
        buttons.style.display = 'block';
        return;
      }

      const data = node.nodeData.data;
      const showConf = data?.showConf;
      const buttons = [];

      // 添加子节点按钮
      if (!!RelationNodeMap.get(showConf?.nodeType)) {
        buttons.push({
          type: 'add-child',
          title: '添加子节点',
          path: 'M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z',
          fill: '#1677ff'
        });
      }

      // 添加前置节点按钮
      if (!data.forward && !data.isroot) {
        buttons.push({
          type: 'add-forward',
          title: '添加前置节点',
          path: 'M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137h302v216a42 42 0 0042 42h216v494z',
          fill: '#ff4d4f'
        });
      }

      // 转换节点按钮
      buttons.push({
        type: 'exchange',
        title: '转换节点',
        path: 'M847.9 592H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h605.2L612.9 851c-4.1 5.2-.4 13 6.3 13h72.5c4.9 0 9.5-2.2 12.6-6.1l168.8-214.1c16.5-21 1.6-51.8-25.2-51.8zM872 356H266.8l144.3-183c4.1-5.2.4-13-6.3-13h-72.5c-4.9 0-9.5 2.2-12.6-6.1L150.9 380.2c-16.5 21-1.6 51.8 25.2 51.8h696c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z',
        fill: '#1677ff'
      });

      // 删除节点按钮
      if (!data.isroot) {
        buttons.push({
          type: 'delete',
          title: '删除节点',
          path: 'M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z',
          fill: '#ff4d4f'
        });
      }

      // 如果没有按钮可显示，直接返回
      if (buttons.length === 0) {
        return;
      }

      // 创建一个透明的区域来扩展hover范围
      const hoverArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hoverArea.setAttribute('class', 'hover-area');
      hoverArea.setAttribute('x', '0');
      hoverArea.setAttribute('y', `${-node.height/2 - 30}`);
      hoverArea.setAttribute('width', `${node.width}`);
      hoverArea.setAttribute('height', `${node.height + 40}`);
      hoverArea.setAttribute('fill', 'transparent');
      hoverArea.setAttribute('pointer-events', 'all');

      // 创建按钮组
      const buttonsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      buttonsGroup.setAttribute('class', 'node-buttons');
      const buttonWidth = buttons.length * 24;
      const xOffset = (node.width - buttonWidth) / 2;
      buttonsGroup.setAttribute('transform', `translate(${xOffset}, ${-node.height/2 - 25})`);

      // 添加按钮
      buttons.forEach((btn, index) => {
        const button = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        button.setAttribute('class', `tree-btn ${btn.type}`);
        button.setAttribute('transform', `translate(${index * 24}, 0)`);
        button.style.cursor = 'pointer';

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = btn.title;
        button.appendChild(title);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '20');
        rect.setAttribute('height', '20');
        rect.setAttribute('rx', '2');
        rect.setAttribute('ry', '2');
        rect.setAttribute('fill', 'transparent');
        button.appendChild(rect);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', btn.path);
        path.setAttribute('transform', 'scale(0.016)');
        path.setAttribute('fill', btn.fill);
        button.appendChild(path);

        buttonsGroup.appendChild(button);
      });

      // 添加hover区域和按钮组到节点
      nodeEl.appendChild(hoverArea);
      nodeEl.appendChild(buttonsGroup);

      // 添加hover事件到hover区域
      hoverArea.addEventListener('mouseenter', () => {
        if (buttonsGroup) {
          buttonsGroup.style.display = 'block';
        }
      });

      hoverArea.addEventListener('mouseleave', (e) => {
        const rect = hoverArea.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          if (buttonsGroup) {
            buttonsGroup.style.display = 'none';
          }
        }
      });
    });

    mindMapRef.current.on('node_mouseleave', (node: any, e: any) => {
      // 移除旧的事件处理，让hover区域处理显示/隐藏
    });

    // 注册节点按钮点击事件
    mindMapRef.current.on('node_mousedown', (node: any, e: any) => {
      const target = e.target as Element;
      const button = target.closest('.tree-btn');
      if (button) {
        e.stopPropagation();
        const treeNode = transformMindMapToTree(node);
        if (!treeNode) return;

        // 设置当前选中的节点
        setSelectedNode(treeNode);

        if (button.classList.contains('add-child')) {
          setAddExchangeNodeModalObj({
            visible: true,
            modalType: 'child'
          });
        } else if (button.classList.contains('add-forward')) {
          setAddExchangeNodeModalObj({
            visible: true,
            modalType: 'front'
          });
        } else if (button.classList.contains('exchange')) {
          setAddExchangeNodeModalObj({
            visible: true,
            modalType: 'exchange'
          });
        } else if (button.classList.contains('delete')) {
          if (!treeNode.isRoot) {
            deleteNode(treeNode);
          }
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
      if (node.data.data.isForward) {
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
        nextId: sourceNode.nextId,
        index: sourceNode.index,
        moveTo: targetNode.dragOver && !!RelationNodeMap.get(targetNode.showConf.nodeType) ? 0 : (sourceNode.parentId === targetNode.parentId && targetNode.index > sourceNode.index ? targetNode.index : targetNode.index + 1),
        moveToParentId: targetNode.dragOver && !!RelationNodeMap.get(targetNode.showConf.nodeType) ? targetNode.showConf.nodeId : (sourceNode.parentId !== targetNode.parentId ? targetNode.parentId : undefined)
      };

      apis.editConf(params)
        .then(() => {
          console.log('MindMap editConf success, calling refresh')
          refresh()
          console.log('MindMap refresh done')
          message.success('success');
        })
        .catch((err: any) => {
          console.error('MindMap editConf error:', err)
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
  }, [treeList]);

  return (
    <div ref={containerRef} className="mind-map-wrapper">
      <div className="mind-map-container"></div>
      <AddExchangeNodeModal
        selectedNode={selectedNode}
        refresh={refresh}
        app={app}
        iceId={iceId}
        closeModal={() => {
          setAddExchangeNodeModalObj((pre) => ({ ...pre, visible: false }));
        }}
        {...addExchangeNodeModalObj}
      />
    </div>
  );
};

export default MindMapComponent;
