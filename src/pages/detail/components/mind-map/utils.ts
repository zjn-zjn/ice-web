import type { TreeItem } from '../../types'

export const transformTreeToMindMap = (treeItems: TreeItem[], registeredClasses: Set<string> | null, isDark: boolean, mockSet?: Set<number>): any => {
  if (!treeItems?.length) {
    return {
      data: { id: 'root', text: 'Empty', expanded: true, isroot: true, direction: 2 },
      children: []
    };
  }

  const transformNode = (item: TreeItem, level: number = 0): any => {
    if (!item?.showConf) return null;

    const isUnregistered = registeredClasses !== null
      && [5, 6, 7].includes(item.showConf?.nodeType)
      && item.showConf?.confName
      && !registeredClasses.has(item.showConf.confName);

    const isMocked = mockSet?.has(item.showConf.nodeId);

    const node = {
      data: {
        id: item.showConf.uniqueKey,
        text: item.isForward ? `\u25C0 ${item.showConf.labelName}` : `${item.showConf.labelName}`,
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
        color: isUnregistered ? (isDark ? '#6b6b6b' : '#999') : (item.isForward ? '#722ed1' : undefined),
        borderColor: isMocked ? '#faad14'
          : (item.showConf.updating ? '#faad14'
          : isUnregistered ? (isDark ? '#434343' : '#d9d9d9')
          : (item.isForward ? '#722ed1' : undefined)),
        borderWidth: isMocked ? 2 : undefined,
        borderDasharray: (item.showConf.updating || isUnregistered) ? '5,3' : undefined,
        fillColor: isUnregistered ? (isDark ? '#2a2a2a' : '#f0f0f0') : undefined,
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

export const getThemeConfig = (isDark: boolean) => ({
  backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
  lineWidth: 1, lineColor: isDark ? '#5a5a5a' : '#bfbfbf',
  generalizationLineWidth: 1, generalizationLineColor: isDark ? '#5a5a5a' : '#bfbfbf',
  root: {
    shape: 'rectangle', marginX: 20, marginY: 0, fillColor: isDark ? '#1668dc' : '#bae0ff',
    fontFamily: '\u5FAE\u8F6F\u96C5\u9ED1, Microsoft YaHei', color: isDark ? '#fff' : '#000000', fontSize: 14,
    fontWeight: 400, borderWidth: 2, borderColor: isDark ? '#434343' : '#d9d9d9', borderStyle: 'solid',
    borderRadius: 4, padding: [15, 15, 15, 15]
  },
  second: {
    shape: 'rectangle', marginX: 20, marginY: 15, fillColor: isDark ? '#2a2a2a' : '#fff',
    fontFamily: '\u5FAE\u8F6F\u96C5\u9ED1, Microsoft YaHei', color: isDark ? '#e8e8e8' : '#333', fontSize: 14,
    fontWeight: 400, borderWidth: 1, borderColor: isDark ? '#434343' : '#d9d9d9', borderStyle: 'solid',
    borderRadius: 4, padding: [10, 10, 10, 10]
  },
  node: {
    shape: 'rectangle', marginX: 20, marginY: 15, fillColor: isDark ? '#2a2a2a' : '#fff',
    fontFamily: '\u5FAE\u8F6F\u96C5\u9ED1, Microsoft YaHei', color: isDark ? '#e8e8e8' : '#333', fontSize: 14,
    fontWeight: 400, borderWidth: 1, borderColor: isDark ? '#434343' : '#d9d9d9', borderStyle: 'solid',
    borderRadius: 4, padding: [10, 10, 10, 10]
  }
});
