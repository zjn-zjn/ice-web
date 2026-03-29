import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import MindMap from 'simple-mind-map';
import type { TreeItem } from '../../types';
import './index.less';
import { App, Button, Space, Tooltip } from 'antd';
import { EditOutlined, PlusOutlined, NodeIndexOutlined, DeleteOutlined, PlayCircleOutlined, InteractionOutlined } from '@ant-design/icons';
import apis from '../../../../apis';
import Drag from 'simple-mind-map/src/plugins/Drag.js';
import { RelationNodeMap } from '../../types';
import type { LeafClassInfo } from '../../../../types';
import { useTheme } from '../../../../theme/ThemeContext';
import { useServerConfig } from '../../../../context/ServerConfigContext';
import type { MockProcessNode } from '../mock-modal';
import { transformTreeToMindMap, getThemeConfig } from './utils';

interface Props {
  treeList: TreeItem[];
  refresh: () => void;
  setSelectedNode: (item: TreeItem | undefined) => void;
  selectedNode: TreeItem | undefined;
  app: string | number;
  iceId: string | number;
  lane?: string;
  onEditNode: (node: TreeItem) => void;
  onAddChild: (node: TreeItem) => void;
  onAddFront: (node: TreeItem) => void;
  onCompareNode: (node: TreeItem) => void;
  onDeleteSuccess: (params: { selectId: number; parentId?: number; nextId?: number; index?: number }) => void;
  onMoveSuccess: (params: Record<string, any>) => void;
  onMockNode: (node: TreeItem) => void;
  registeredClasses: Set<string> | null;
  leafClassMap?: Record<number, LeafClassInfo[]>;
  mockProcessNodes?: MockProcessNode[];
  mockVisible?: boolean;
}

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

MindMap.usePlugin(Drag);

const MindMapComponent = forwardRef(({
  treeList, refresh, setSelectedNode, selectedNode, app, iceId, lane,
  onEditNode, onAddChild, onAddFront, onCompareNode, onDeleteSuccess, onMoveSuccess, onMockNode,
  registeredClasses, leafClassMap, mockProcessNodes, mockVisible
}: Props, ref) => {
  const { modal, message } = App.useApp();
  const { isDark } = useTheme();
  const { controlled } = useServerConfig();
  const mindMapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const initializedRef = useRef(false);

  // Use refs for callbacks to avoid stale closures
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const onDeleteSuccessRef = useRef(onDeleteSuccess);
  onDeleteSuccessRef.current = onDeleteSuccess;
  const onMoveSuccessRef = useRef(onMoveSuccess);
  onMoveSuccessRef.current = onMoveSuccess;
  const setSelectedNodeRef = useRef(setSelectedNode);
  setSelectedNodeRef.current = setSelectedNode;
  const onEditNodeRef = useRef(onEditNode);
  onEditNodeRef.current = onEditNode;
  const appRef = useRef(app);
  appRef.current = app;
  const iceIdRef = useRef(iceId);
  iceIdRef.current = iceId;
  const laneRef = useRef(lane);
  laneRef.current = lane;

  useImperativeHandle(ref, () => ({
    resetView: () => {
      if (mindMapRef.current?.view) {
        mindMapRef.current.view.translateXTo(-400);
        mindMapRef.current.view.translateYTo(-50);
      }
    },
    updateData: (newTreeList: TreeItem[], newRegisteredClasses: Set<string> | null) => {
      if (mindMapRef.current) {
        const data = transformTreeToMindMap(newTreeList, newRegisteredClasses, isDark);
        mindMapRef.current.updateData(data);
      }
    }
  }), [isDark]);

  const deleteNode = useCallback((currentNode: TreeItem) => {
    modal.confirm({
      title: `确认删除<${currentNode.showConf.labelName}>节点吗？`,
      onOk: async () => {
        try {
          const params = {
            app: Number(appRef.current), iceId: Number(iceIdRef.current), editType: 3,
            selectId: currentNode.showConf.nodeId,
            parentId: currentNode.parentId,
            nextId: currentNode.nextId,
            index: currentNode.index,
            lane: laneRef.current,
          };
          await apis.editConf(params);
          onDeleteSuccessRef.current({
            selectId: currentNode.showConf.nodeId,
            parentId: currentNode.parentId,
            nextId: currentNode.nextId,
            index: currentNode.index,
          });
          message.success('success');
        } catch (err) {
          console.error('delete node failed:', err);
        }
      }
    });
  }, []);

  // Initialize MindMap once
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current && mindMapRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          mindMapRef.current.resize(width, height);
        }
      }
    };

    const emptyData = {
      data: { id: 'root', text: 'Loading...', expanded: true, isroot: true, direction: 2 },
      children: []
    };

    mindMapRef.current = new MindMap({
      el: containerRef.current,
      data: emptyData,
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
          message.warning('叶子节点不支持子节点');
          return true;
        }
        return false;
      },
      themeConfig: getThemeConfig(isDark)
    } as any);

    mindMapRef.current.on('node_tree_render_end', async () => {
      if (mindMapRef.current && !initializedRef.current) {
        initializedRef.current = true;
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

    mindMapRef.current.on('node_dragging', () => {
      setToolbarPos(null);
    });

    mindMapRef.current.on('node_click', (node: any, e: any) => {
      const treeNode = transformMindMapToTree(node);
      if (!treeNode) return;
      setSelectedNodeRef.current(treeNode);
      if (containerRef.current && e) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX || e.x || 0) - rect.left;
        const y = (e.clientY || e.y || 0) - rect.top;
        setToolbarPos({ x, y: Math.max(0, y - 70) });
      }
    });

    mindMapRef.current.on('node_dblclick', (node: any) => {
      const treeNode = transformMindMapToTree(node);
      if (!treeNode) return;
      setSelectedNodeRef.current(treeNode);
      setToolbarPos(null);
      onEditNodeRef.current(treeNode);
    });

    mindMapRef.current.on('draw_click', () => {
      setSelectedNodeRef.current(undefined);
      setToolbarPos(null);
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
        const params: any = {
          app: Number(appRef.current), iceId: Number(iceIdRef.current), editType: 6,
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
          nextId: dragData.nextId,
          lane: laneRef.current,
        };
        apis.editConf(params)
          .then(() => {
            onMoveSuccessRef.current(params);
            message.success('success');
          })
          .catch(() => { refreshRef.current(); });
      }
    });

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (mindMapRef.current) {
        mindMapRef.current.destroy();
        mindMapRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []);

  // Update theme when isDark changes
  useEffect(() => {
    if (!mindMapRef.current) return;
    mindMapRef.current.setThemeConfig(getThemeConfig(isDark));
  }, [isDark]);

  // Update data when treeList, registeredClasses, or mockProcessNodes change
  useEffect(() => {
    if (!mindMapRef.current || !treeList?.length) return;
    const mockSet = mockProcessNodes?.length
      ? new Set(mockProcessNodes.map(n => n.confId))
      : undefined;
    const mindMapData = transformTreeToMindMap(treeList, registeredClasses, isDark, mockSet);
    mindMapRef.current.updateData(mindMapData);
  }, [treeList, registeredClasses, isDark, mockProcessNodes]);

  // Shift tree right when mock panel opens
  const prevMockVisible = useRef(false);
  useEffect(() => {
    if (!mindMapRef.current?.view) return;
    if (mockVisible && !prevMockVisible.current) {
      mindMapRef.current.view.translateX(200);
    } else if (!mockVisible && prevMockVisible.current) {
      mindMapRef.current.view.translateX(-200);
    }
    prevMockVisible.current = !!mockVisible;
  }, [mockVisible]);

  const isRelation = selectedNode && RelationNodeMap.has(selectedNode.showConf?.nodeType);
  const hasForward = selectedNode?.forward || selectedNode?.forwardId;
  const isRoot = selectedNode?.isRoot;

  return (
    <>
      <div ref={containerRef} className="mind-map-container"></div>
      {selectedNode && toolbarPos && (
        <div className="node-toolbar" style={{ left: toolbarPos.x, top: toolbarPos.y, transform: 'translateX(-50%)' }}>
          <Space size={8}>
            <Tooltip title="编辑" mouseEnterDelay={0.3}>
              <Button type="text" size="small" icon={<EditOutlined />}
                onClick={() => { setToolbarPos(null); onEditNode(selectedNode); }}
              />
            </Tooltip>
            {isRelation && (
              <Tooltip title={controlled ? "引用子节点" : "加子节点"} mouseEnterDelay={0.3}>
                <Button type="text" size="small" icon={<PlusOutlined />}
                  onClick={() => { setToolbarPos(null); onAddChild(selectedNode); }}
                />
              </Tooltip>
            )}
            {!hasForward && (
              <Tooltip title={controlled ? "引用前置" : "加前置"} mouseEnterDelay={0.3}>
                <Button type="text" size="small" icon={<NodeIndexOutlined />}
                  onClick={() => { setToolbarPos(null); onAddFront(selectedNode); }}
                />
              </Tooltip>
            )}
            <Tooltip title="Mock" mouseEnterDelay={0.3}>
              <Button type="text" size="small" icon={<PlayCircleOutlined />}
                onClick={() => { setToolbarPos(null); onMockNode(selectedNode); }}
              />
            </Tooltip>
            {selectedNode.showConf?.updating && (
              <Tooltip title="对比" mouseEnterDelay={0.3}>
                <Button type="text" size="small" icon={<InteractionOutlined />}
                  onClick={() => { setToolbarPos(null); onCompareNode(selectedNode); }}
                />
              </Tooltip>
            )}
            {!isRoot && (
              <Tooltip title="删除" mouseEnterDelay={0.3}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />}
                  onClick={() => deleteNode(selectedNode)}
                />
              </Tooltip>
            )}
          </Space>
        </div>
      )}
    </>
  );
});

export default MindMapComponent;
