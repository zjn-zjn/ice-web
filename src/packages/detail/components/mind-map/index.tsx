import { useEffect, useRef, useState, useCallback } from 'react';
import MindMap from 'simple-mind-map';
import type { TreeItem } from '../../types';
import './index.less';
import { Modal, message, Button, Space } from 'antd';
import { EditOutlined, PlusOutlined, NodeIndexOutlined, DeleteOutlined } from '@ant-design/icons';
import apis from '../../../../apis';
import Drag from 'simple-mind-map/src/plugins/Drag.js';
import { RelationNodeMap } from '../../types';
import type { LeafClassInfo } from '../../../../index.d';

interface Props {
  treeList: TreeItem[];
  refresh: () => void;
  setSelectedNode: (item: TreeItem | undefined) => void;
  selectedNode: TreeItem | undefined;
  app: string;
  iceId: string;
  lane?: string;
  onEditNode: (node: TreeItem) => void;
  onAddChild: (node: TreeItem) => void;
  onAddFront: (node: TreeItem) => void;
  selectedClientClasses: Set<string> | null;
  leafClassMap?: Record<number, LeafClassInfo[]>;
}

const transformTreeToMindMap = (treeItems: TreeItem[], selectedClientClasses: Set<string> | null): any => {
  if (!treeItems?.length) {
    return {
      data: { id: 'root', text: 'Empty', expanded: true, isroot: true, direction: 2 },
      children: []
    };
  }

  const transformNode = (item: TreeItem, level: number = 0): any => {
    if (!item?.showConf) return null;

    const isUnregistered = selectedClientClasses !== null
      && [5, 6, 7].includes(item.showConf?.nodeType)
      && item.showConf?.confName
      && !selectedClientClasses.has(item.showConf.confName);

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
        color: isUnregistered ? '#999' : (item.isForward ? '#f50' : undefined),
        borderColor: item.showConf.updating ? '#fa8c16'
          : isUnregistered ? '#ccc'
          : (item.isForward ? '#f50' : undefined),
        borderDasharray: (item.showConf.updating || isUnregistered) ? '5,3' : undefined,
        fillColor: isUnregistered ? '#f5f5f5' : undefined,
      },
      children: [] as any[]
    };

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

  return transformNode(treeItems[0]);
};

const transformMindMapToTree = (node: any): TreeItem | undefined => {
  if (!node?.nodeData) return undefined;
  const { data } = node.nodeData;
  if (!data) return undefined;
  const { showConf, isForward, isroot, parentId, index, timeType, start, end, nextId, forwardId } = data;
  return {
    showConf, isForward, isRoot: isroot, parentId, index, timeType, start, end, nextId, forwardId,
    key: showConf?.uniqueKey,
    text: showConf?.labelName,
    children: []
  } as TreeItem;
};

const MindMapComponent = ({
  treeList, refresh, setSelectedNode, selectedNode, app, iceId, lane,
  onEditNode, onAddChild, onAddFront, selectedClientClasses, leafClassMap
}: Props) => {
  const mindMapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedNode(undefined);
    setToolbarPos(null);
  }, [setSelectedNode]);

  const deleteNode = useCallback((currentNode: TreeItem) => {
    Modal.confirm({
      title: `确认删除<${currentNode.showConf.labelName}>节点吗？`,
      onOk: async () => {
        try {
          await apis.editConf({
            app, iceId, editType: 3,
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
  }, [app, iceId, refresh]);

  useEffect(() => {
    if (!containerRef.current || !treeList?.length) return;

    const updateSize = () => {
      if (containerRef.current && mindMapRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          mindMapRef.current.resize(width, height);
        }
      }
    };

    const mindMapData = transformTreeToMindMap(treeList, selectedClientClasses);

    const customTheme = {
      backgroundColor: '#fafafa',
      lineWidth: 1, lineColor: '#959da5',
      generalizationLineWidth: 1, generalizationLineColor: '#959da5',
      root: {
        shape: 'rectangle', marginX: 20, marginY: 0, fillColor: '#86b4da',
        fontFamily: '微软雅黑, Microsoft YaHei', color: '#000000', fontSize: 14,
        fontWeight: 400, borderWidth: 2, borderColor: '#c7ccd1', borderStyle: 'solid',
        borderRadius: 4, padding: [15, 15, 15, 15]
      },
      second: {
        shape: 'rectangle', marginX: 20, marginY: 15, fillColor: '#fff',
        fontFamily: '微软雅黑, Microsoft YaHei', color: '#333', fontSize: 14,
        fontWeight: 400, borderWidth: 1, borderColor: '#c7ccd1', borderStyle: 'solid',
        borderRadius: 4, padding: [10, 10, 10, 10]
      },
      node: {
        shape: 'rectangle', marginX: 20, marginY: 15, fillColor: '#fff',
        fontFamily: '微软雅黑, Microsoft YaHei', color: '#333', fontSize: 14,
        fontWeight: 400, borderWidth: 1, borderColor: '#c7ccd1', borderStyle: 'solid',
        borderRadius: 4, padding: [10, 10, 10, 10]
      }
    };

    MindMap.usePlugin(Drag);

    mindMapRef.current = new MindMap({
      el: containerRef.current,
      data: mindMapData,
      layout: 'logicalStructure',
      direction: 2,
      view: { zoom: 0.8 },
      draggable: true,
      mousewheelZoom: true,
      mouseSelectionShow: true,
      readonly: false,
      beforeTextEdit: () => false,
      beforeDragEnd: ({ overlapNodeUid }: { overlapNodeUid: string }) => {
        const overlapNode = mindMapRef.current.renderer.findNodeByUid(overlapNodeUid);
        if (!overlapNode) return false;
        const showConf = overlapNode.getData('showConf');
        if (showConf && [5, 6, 7].includes(showConf.nodeType)) {
          return true;
        }
        return false;
      },
      themeConfig: customTheme
    } as any);

    mindMapRef.current.on('node_tree_render_end', async () => {
      if (mindMapRef.current) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        mindMapRef.current.view.translateXTo(-400);
        mindMapRef.current.view.translateYTo(-50);
        const shortcuts = [
          'Tab', 'Enter', 'Shift+Tab', 'Control+↑', 'Control+↓', 'Control+G',
          '/', 'Delete', 'Backspace', 'Shift+Backspace', 'Control+C', 'Control+X',
          'Control+V', 'F2', 'Shift+Enter', 'Control+Z', 'Control+Y', 'Control+A', 'Control+L'
        ];
        shortcuts.forEach(s => mindMapRef.current.keyCommand.removeShortcut(s));
      }
    });

    mindMapRef.current.on('node_click', (node: any, e: any) => {
      const treeNode = transformMindMapToTree(node);
      if (!treeNode) return;
      setSelectedNode(treeNode);
      if (containerRef.current && e) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX || e.x || 0) - rect.left;
        const y = (e.clientY || e.y || 0) - rect.top;
        setToolbarPos({ x: Math.max(0, x - 80), y: Math.max(0, y - 70) });
      }
    });

    mindMapRef.current.on('node_dblclick', (node: any) => {
      const treeNode = transformMindMapToTree(node);
      if (!treeNode) return;
      setSelectedNode(treeNode);
      setToolbarPos(null);
      onEditNode(treeNode);
    });

    mindMapRef.current.on('draw_click', () => {
      clearSelection();
    });

    mindMapRef.current.on('afterExecCommand', (name: string, ...args: any[]) => {
      if (name === 'MOVE_NODE_TO' || name === 'INSERT_AFTER' || name === 'INSERT_BEFORE') {
        const [dragNodes, targetNode] = args;
        if (!dragNodes?.length || !targetNode) return;
        const dragNode = dragNodes[0];
        const dragData = dragNode.getData();
        const targetData = targetNode.getData();
        if (!dragData || !targetData) return;
        const moveTo = name === 'MOVE_NODE_TO';
        const before = name === 'INSERT_BEFORE';
        const after = name === 'INSERT_AFTER';
        const canHaveChildren = ![5, 6, 7].includes(targetData.showConf.nodeType);
        if (!canHaveChildren && moveTo) return;
        const params = {
          app, iceId, editType: 6,
          parentId: dragData.parentId,
          selectId: dragData.showConf?.nodeId,
          index: dragData.index,
          moveTo: moveTo ? undefined
            : targetData.isForward ? 0
            : (before ? targetData.index : after ? targetData.index + 1 : undefined),
          moveToParentId: moveTo
            ? targetData.showConf?.nodeId
            : targetData.isForward ? targetData.nextId
            : targetData.parentId,
          nextId: dragData.nextId
        };
        apis.editConf(params)
          .then(() => { refresh(); message.success('success'); })
          .catch((err: any) => { message.error(err.msg || 'server error'); refresh(); });
      }
    });

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (mindMapRef.current) {
        mindMapRef.current.destroy();
      }
    };
  }, [treeList, selectedClientClasses]);

  const isRelation = selectedNode && RelationNodeMap.has(selectedNode.showConf?.nodeType);
  const hasForward = selectedNode?.forward || selectedNode?.forwardId;
  const isRoot = selectedNode?.isRoot;

  return (
    <>
      <div ref={containerRef} className="mind-map-container"></div>
      {selectedNode && toolbarPos && (
        <div className="node-toolbar" style={{ left: toolbarPos.x, top: toolbarPos.y }}>
          <Space size={4}>
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => { setToolbarPos(null); onEditNode(selectedNode); }}
            >编辑</Button>
            {isRelation && (
              <Button type="text" size="small" icon={<PlusOutlined />}
                onClick={() => { setToolbarPos(null); onAddChild(selectedNode); }}
              >子节点</Button>
            )}
            {!hasForward && (
              <Button type="text" size="small" icon={<NodeIndexOutlined />}
                onClick={() => { setToolbarPos(null); onAddFront(selectedNode); }}
              >前置</Button>
            )}
            {!isRoot && (
              <Button type="text" size="small" danger icon={<DeleteOutlined />}
                onClick={() => deleteNode(selectedNode)}
              >删除</Button>
            )}
          </Space>
        </div>
      )}
    </>
  );
};

export default MindMapComponent;
