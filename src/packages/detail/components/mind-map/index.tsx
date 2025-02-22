import { useEffect, useRef, useState } from 'react';
import MindMap from 'simple-mind-map';
import type { TreeItem } from '../../types';
import './index.less';
import { Modal, message, Tooltip } from 'antd';
import AddExchangeNodeModal from './AddExchangeNodeModal';
import apis from '../../../../apis';
import Drag from 'simple-mind-map/src/plugins/Drag.js';
import {
  PlusCircleTwoTone,
  ControlTwoTone,
  PlusSquareTwoTone,
  DeleteOutlined
} from '@ant-design/icons';
import { RelationNodeMap } from '../../types';

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

    // Create node
    const node = {
      data: {
        id: item.showConf.uniqueKey,
        text: `${item.showConf.labelName}`,
        expanded: true,
        direction: 2,
        isroot: item.isRoot,
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
      children: [] as any[]
    };

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
  return rootNode;
};

// 转换思维导图节点为树节点
const transformMindMapToTree = (node: any): TreeItem | undefined => {
  if (!node?.nodeData) return undefined;

  const { data } = node.nodeData;
  if (!data) return undefined;

  const { showConf, isForward, isRoot, parentId, index, timeType, start, end, nextId, forwardId } = data;

  return {
    showConf,
    isForward,
    isRoot,
    parentId,
    index,
    timeType,
    start,
    end,
    nextId,
    forwardId,
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
          console.log(currentNode);
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

    const customTheme = {
      backgroundColor: '#fafafa',
      lineWidth: 1,
      lineColor: '#959da5',
      generalizationLineWidth: 1,
      generalizationLineColor: '#959da5',

      root: {
        shape: 'rectangle',
        marginX: 20,
        marginY: 0,
        fillColor: '#86b4da',
        fontFamily: '微软雅黑, Microsoft YaHei',
        color: '#000000',
        fontSize: 14,
        fontWeight: 400,
        borderWidth: 2,
        borderColor: '#c7ccd1',
        borderStyle: 'solid',
        borderRadius: 4,
        padding: [15, 15, 15, 15]
      },

      second: {
        shape: 'rectangle',
        marginX: 20,
        marginY: 15,
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
        marginX: 20,
        marginY: 15,
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

    MindMap.usePlugin(Drag);

    // 初始化思维导图
    mindMapRef.current = new MindMap({
      el: containerRef.current,
      data: mindMapData,
      layout: 'logicalStructure',
      direction: 2,
      view: {
        zoom: 0.8
      },
      draggable: address === 'server',  // 只有 server 才能拖动
      mousewheelZoom: true,
      mouseSelectionShow: true,
      readonly: address !== 'server', // 只有 server 才能编辑
      beforeTextEdit: () => {
        return false; // 阻止编辑
      },
      beforeDragEnd: ({ overlapNodeUid }: { overlapNodeUid: string }) => {
        // 如果不是 server，禁止拖动
        if (address !== 'server') return true;
        
        // 获取目标节点
        const overlapNode = mindMapRef.current.renderer.findNodeByUid(overlapNodeUid);
        if (!overlapNode) return false;
        // 如果目标节点是叶子节点，阻止拖放
        if ([5, 6, 7].includes(overlapNode.getData('showConf').nodeType)) {
          return true;
        }
        return false;
      },
      themeConfig: customTheme
    } as any);

    // 监听渲染完成事件
    mindMapRef.current.on('node_tree_render_end', async () => {
      if (mindMapRef.current) {
        // 等待一帧确保渲染完成
        await new Promise(resolve => requestAnimationFrame(resolve));

        // 移动到最左边
        mindMapRef.current.view.translateXTo(-400);
        mindMapRef.current.view.translateYTo(-50);
        
        // 移除所有节点操作相关的快捷键
        const nodeOperationShortcuts = [
          'Tab',                // 插入下级节点
          'Enter',              // 插入同级节点
          'Shift+Tab',          // 插入父节点
          'Control+↑',          // 上移节点
          'Control+↓',          // 下移节点
          'Control+G',          // 插入概要
          '/',                  // 展开/收起节点
          'Delete',             // 删除节点
          'Backspace',          // 删除节点
          'Shift+Backspace',    // 仅删除当前节点
          'Control+C',          // 复制节点
          'Control+X',          // 剪切节点
          'Control+V',          // 粘贴节点
          'F2',                 // 编辑节点
          'Shift+Enter',        // 文本换行
          'Control+Z',          // 回退
          'Control+Y',          // 前进
          'Control+A',          // 全选
          'Control+L'           // 一键整理布局
        ];
        
        nodeOperationShortcuts.forEach(shortcut => {
          mindMapRef.current.keyCommand.removeShortcut(shortcut);
        });
      }
    });

    // 注册节点点击事件
    mindMapRef.current.on('node_click', (node: any) => {
      const treeNode = transformMindMapToTree(node);
      if (!treeNode) return;
      setSelectedNode(treeNode);
    });

    // 注册节点 hover 事件
    mindMapRef.current.on('node_mouseenter', (node: any, e: any) => {
      // 如果不是 server，不显示操作按钮
      if (address !== 'server') return;

      const nodeEl = e.target;

      // 只清除其他节点的按钮和hover区域
      const allButtons = document.querySelectorAll('.node-buttons');
      const allHoverAreas = document.querySelectorAll('.hover-area');
      allButtons.forEach(btn => {
        if (!nodeEl.contains(btn)) {
          btn.remove();
        }
      });
      allHoverAreas.forEach(area => {
        if (!nodeEl.contains(area)) {
          area.remove();
        }
      });

      // 检查当前节点是否已经有按钮
      const existingButtons = nodeEl.querySelector('.node-buttons');
      if (existingButtons) {
        return; // 如果已经有按钮，就不需要再创建了
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
      if (!data.forward) {
        buttons.push({
          type: 'add-forward',
          title: '添加前置节点',
          path: 'M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z',
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
      hoverArea.setAttribute('y', `${-node.height / 2 + 10}`); // 只覆盖按钮区域上方一点点
      hoverArea.setAttribute('width', `${node.width}`);
      hoverArea.setAttribute('height', `${node.height + 40}`);
      hoverArea.setAttribute('fill', 'transparent');
      hoverArea.setAttribute('pointer-events', 'all');

      // 创建按钮组
      const buttonsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      buttonsGroup.setAttribute('class', 'node-buttons');
      const buttonWidth = buttons.length * 24;
      const xOffset = (node.width - buttonWidth) / 2;
      buttonsGroup.setAttribute('transform', `translate(${xOffset}, ${-node.height / 2})`);

      // 添加按钮组背景
      const groupBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      groupBackground.setAttribute('width', `${buttonWidth}`);
      groupBackground.setAttribute('height', '20');
      groupBackground.setAttribute('fill', 'transparent');
      groupBackground.setAttribute('rx', '2');
      groupBackground.setAttribute('ry', '2');
      buttonsGroup.appendChild(groupBackground);

      // 添加按钮
      buttons.forEach((btn, index) => {
        const button = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        button.setAttribute('class', `tree-btn ${btn.type}`);
        button.setAttribute('transform', `translate(${index * 24}, 0)`);
        button.style.cursor = 'pointer';

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

        // 创建并定位tooltip
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('width', '200');
        foreignObject.setAttribute('height', '25');
        foreignObject.setAttribute('x', '-90');  // 这个值会在下面动态计算
        foreignObject.setAttribute('y', '-22');

        const title = document.createElement('div');
        title.setAttribute('style', `
          visibility: hidden;
          background-color: rgba(0, 0, 0, 0.75);
          color: white;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 12px;
          position: absolute;
          white-space: nowrap;
          transition: visibility 0s linear 500ms;
        `);
        title.textContent = btn.title;
        foreignObject.appendChild(title);

        // 添加hover事件
        button.addEventListener('mouseenter', () => {
          // 计算tooltip的位置，使其居中对齐
          const titleWidth = title.offsetWidth;
          const buttonWidth = 20; // 按钮的宽度
          const xOffset = (buttonWidth - titleWidth) / 2 + 100;
          foreignObject.setAttribute('x', `${xOffset}`);

          setTimeout(() => {
            if (button.matches(':hover')) {
              title.style.visibility = 'visible';
            }
          }, 500);
        });

        button.addEventListener('mouseleave', () => {
          title.style.visibility = 'hidden';
        });

        button.appendChild(foreignObject);

        // 直接添加点击事件
        button.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          const treeNode = transformMindMapToTree(node);
          if (!treeNode) return;

          // 设置当前选中的节点
          setSelectedNode(treeNode);

          if (btn.type === 'add-child') {
            setAddExchangeNodeModalObj({
              visible: true,
              modalType: 'child'
            });
          } else if (btn.type === 'add-forward') {
            setAddExchangeNodeModalObj({
              visible: true,
              modalType: 'front'
            });
          } else if (btn.type === 'exchange') {
            setAddExchangeNodeModalObj({
              visible: true,
              modalType: 'exchange'
            });
          } else if (btn.type === 'delete') {
            if (!treeNode.isRoot) {
              deleteNode(treeNode);
            }
          }
        });

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

    // 注册拖拽完成事件
    mindMapRef.current.on('afterExecCommand', (name: string, ...args: any[]) => {
      console.log("afterExecCommand", name, args);
      if (name === 'MOVE_NODE_TO' || name === 'INSERT_AFTER' || name === 'INSERT_BEFORE') {
        const [dragNodes, targetNode] = args;

        if (!dragNodes || !dragNodes.length || !targetNode) return;

        const dragNode = dragNodes[0];
        const dragData = dragNode.getData();
        const targetData = targetNode.getData();
        if (!dragData || !targetData) return;
        // 如果目标节点是可以有子节点的，并且是拖到节点上
        const moveTo = name === 'MOVE_NODE_TO';
        const before = name === 'INSERT_BEFORE';
        const after = name === 'INSERT_AFTER';
        const canHaveChildren = ![5, 6, 7].includes(targetData.showConf.nodeType);
        if (!canHaveChildren && moveTo) return;
        const params = {
          app,
          iceId,
          editType: 6,
          parentId: dragData.parentId,
          selectId: dragData.showConf?.nodeId,
          index: dragData.index,
          moveTo: moveTo? undefined
            : targetData.isForward ? 0 
            : (before ? targetData.index : after ? targetData.index + 1 : undefined),
          moveToParentId: moveTo
            ? targetData.showConf?.nodeId
            : targetData.isForward ? targetData.nextId
            : targetData.parentId,
          nextId: dragData.nextId
        };

        apis.editConf(params)
          .then(() => {
            refresh();
            message.success('success');
          })
          .catch((err: any) => {
            message.error(err.msg || 'server error');
            refresh();
          });
      }
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
    <>
      <div ref={containerRef} className="mind-map-container"></div>
      <AddExchangeNodeModal
        selectedNode={selectedNode}
        refresh={refresh}
        app={app}
        iceId={iceId}
        address={address}
        closeModal={() => {
          setAddExchangeNodeModalObj((pre) => ({ ...pre, visible: false }));
        }}
        {...addExchangeNodeModalObj}
      />
    </>
  );
};

export default MindMapComponent;
