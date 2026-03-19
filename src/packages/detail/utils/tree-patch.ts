import type { ChildrenItem } from '../../../index.d'

const nodeTypeNames: Record<number, string> = {
  0: 'NONE', 1: 'AND', 2: 'TRUE', 3: 'ALL', 4: 'ANY',
  5: 'LEAF_FLOW', 6: 'LEAF_RESULT', 7: 'LEAF_NONE',
  8: 'P_NONE', 9: 'P_AND', 10: 'P_TRUE', 11: 'P_ALL', 12: 'P_ANY',
}

const isRelation = (t: number) => (t >= 0 && t <= 4) || (t >= 8 && t <= 12)

export function generateLabelName(nodeId: number, nodeType: number, confName?: string, name?: string): string {
  let label: string
  if (isRelation(nodeType)) {
    label = `${nodeId}-${nodeTypeNames[nodeType] || 'UNKNOWN'}`
  } else {
    let shortName = confName || ' '
    const idx = shortName.lastIndexOf('.')
    if (idx >= 0) shortName = shortName.substring(idx + 1)
    if (!shortName) shortName = ' '
    label = `${nodeId}-${shortName}`
  }
  if (name) label += `-${name}`
  return label
}

export function cloneTree(root: ChildrenItem): ChildrenItem {
  return JSON.parse(JSON.stringify(root))
}

export function walkTree(
  root: ChildrenItem,
  callback: (node: ChildrenItem, parent?: ChildrenItem, indexInParent?: number) => void
): void {
  const walk = (node: ChildrenItem, parent?: ChildrenItem, idx?: number) => {
    callback(node, parent, idx)
    if (node.forward) walk(node.forward, node, -1)
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        walk(node.children[i], node, i)
      }
    }
  }
  walk(root)
}

export function findAllByNodeId(root: ChildrenItem, nodeId: number): ChildrenItem[] {
  const result: ChildrenItem[] = []
  walkTree(root, (node) => {
    if (node.showConf?.nodeId === nodeId) result.push(node)
  })
  return result
}

export function regenerateUniqueKeys(node: ChildrenItem, prefix: string, isRoot: boolean, isForward: boolean): void {
  if (!node?.showConf) return
  const idx = node.index ?? 0
  let uniqueKey = `${node.showConf.nodeId}_${idx}`
  if (prefix) uniqueKey = `${prefix}_${uniqueKey}`
  if (isRoot) uniqueKey += '_r'
  if (isForward) uniqueKey += '_f'
  node.showConf.uniqueKey = uniqueKey

  if (node.forward) {
    regenerateUniqueKeys(node.forward, uniqueKey, false, true)
  }
  if (node.children) {
    for (const child of node.children) {
      regenerateUniqueKeys(child, uniqueKey, false, false)
    }
  }
}

export function reindexChildren(parent: ChildrenItem): void {
  if (!parent.children) return
  for (let i = 0; i < parent.children.length; i++) {
    parent.children[i].index = i
    parent.children[i].parentId = parent.showConf?.nodeId
  }
}

export function patchAddChild(root: ChildrenItem, parentNodeId: number, newChild: ChildrenItem): void {
  const parents = findAllByNodeId(root, parentNodeId)
  for (const p of parents) {
    if (!p.children) p.children = []
    const child = cloneTree(newChild)
    child.index = p.children.length
    child.parentId = parentNodeId
    p.children.push(child)
    // update sonIds
    const sonId = String(child.showConf?.nodeId)
    p.sonIds = p.sonIds ? `${p.sonIds},${sonId}` : sonId
    reindexChildren(p)
    if (p.showConf) p.showConf.updating = true
  }
}

export function patchRemoveChild(root: ChildrenItem, parentNodeId: number, childIndex: number): void {
  const parents = findAllByNodeId(root, parentNodeId)
  for (const p of parents) {
    if (!p.children || childIndex < 0 || childIndex >= p.children.length) continue
    p.children.splice(childIndex, 1)
    // update sonIds
    if (p.sonIds) {
      const ids = p.sonIds.split(',')
      ids.splice(childIndex, 1)
      p.sonIds = ids.join(',')
    }
    reindexChildren(p)
    if (p.showConf) p.showConf.updating = true
  }
}

export function patchSetForward(root: ChildrenItem, nodeId: number, forward: ChildrenItem | undefined): void {
  const nodes = findAllByNodeId(root, nodeId)
  for (const n of nodes) {
    if (forward) {
      const fwd = cloneTree(forward)
      n.forward = fwd
      n.forwardId = fwd.showConf?.nodeId
    } else {
      n.forward = undefined
      n.forwardId = undefined
    }
    if (n.showConf) n.showConf.updating = true
  }
}

export function patchUpdateProps(
  root: ChildrenItem,
  nodeId: number,
  props: Partial<{
    debug: boolean; inverse: boolean; timeType: number; start: number; end: number;
    name: string; confField: string; nodeType: number; confName: string;
  }>
): void {
  const nodes = findAllByNodeId(root, nodeId)
  for (const n of nodes) {
    if (!n.showConf) continue
    if (props.debug !== undefined) n.showConf.debug = props.debug
    if (props.inverse !== undefined) n.showConf.inverse = props.inverse
    if (props.name !== undefined) n.showConf.nodeName = props.name
    if (props.confField !== undefined) n.showConf.confField = props.confField
    if (props.nodeType !== undefined) {
      n.showConf.nodeType = props.nodeType
      // If changed from relation to leaf, clear children
      if (!isRelation(props.nodeType) && n.children?.length) {
        n.children = []
        n.sonIds = ''
      }
    }
    if (props.confName !== undefined) n.showConf.confName = props.confName
    if (props.timeType !== undefined) n.timeType = props.timeType
    if (props.start !== undefined) n.start = props.start
    if (props.end !== undefined) n.end = props.end
    // update labelName
    n.showConf.labelName = generateLabelName(
      n.showConf.nodeId, n.showConf.nodeType, n.showConf.confName, n.showConf.nodeName
    )
    n.showConf.updating = true
  }
}

export function patchReplaceChild(
  root: ChildrenItem, parentNodeId: number, childIndex: number, newChild: ChildrenItem
): void {
  const parents = findAllByNodeId(root, parentNodeId)
  for (const p of parents) {
    if (!p.children || childIndex < 0 || childIndex >= p.children.length) continue
    const child = cloneTree(newChild)
    child.index = childIndex
    child.parentId = parentNodeId
    p.children[childIndex] = child
    // update sonIds
    if (p.sonIds) {
      const ids = p.sonIds.split(',')
      ids[childIndex] = String(child.showConf?.nodeId)
      p.sonIds = ids.join(',')
    }
    if (p.showConf) p.showConf.updating = true
  }
}

export function patchMoveChild(
  root: ChildrenItem, fromParentId: number, fromIndex: number,
  toParentId: number, toIndex?: number
): void {
  // Extract the child from source
  const fromParents = findAllByNodeId(root, fromParentId)
  if (!fromParents.length) return
  const srcParent = fromParents[0]
  if (!srcParent.children || fromIndex < 0 || fromIndex >= srcParent.children.length) return
  const movedChild = srcParent.children[fromIndex]

  // For same-parent moves, adjust toIndex after removal
  let adjustedToIndex = toIndex
  if (fromParentId === toParentId && adjustedToIndex !== undefined && adjustedToIndex > fromIndex) {
    adjustedToIndex--
  }

  // Remove from all same-nodeId parents
  for (const p of fromParents) {
    if (!p.children || fromIndex >= p.children.length) continue
    p.children.splice(fromIndex, 1)
    if (p.sonIds) {
      const ids = p.sonIds.split(',')
      ids.splice(fromIndex, 1)
      p.sonIds = ids.join(',')
    }
    reindexChildren(p)
    if (p.showConf) p.showConf.updating = true
  }

  // Insert into target
  const toParents = findAllByNodeId(root, toParentId)
  for (const p of toParents) {
    if (!p.children) p.children = []
    const child = cloneTree(movedChild)
    const insertIdx = adjustedToIndex !== undefined && adjustedToIndex <= p.children.length ? adjustedToIndex : p.children.length
    child.parentId = toParentId
    p.children.splice(insertIdx, 0, child)
    // update sonIds
    const sonId = String(child.showConf?.nodeId)
    if (p.sonIds) {
      const ids = p.sonIds.split(',')
      ids.splice(insertIdx, 0, sonId)
      p.sonIds = ids.join(',')
    } else {
      p.sonIds = sonId
    }
    reindexChildren(p)
    if (p.showConf) p.showConf.updating = true
  }
}

export function buildNewNode(
  nodeId: number,
  params: {
    nodeType?: number; confName?: string; confField?: string; name?: string;
    debug?: boolean; inverse?: boolean; timeType?: number; start?: number; end?: number;
  }
): ChildrenItem {
  const nodeType = params.nodeType ?? 0
  return {
    showConf: {
      uniqueKey: '',
      nodeId,
      nodeType,
      debug: params.debug ?? true,
      inverse: params.inverse ?? false,
      labelName: generateLabelName(nodeId, nodeType, params.confName, params.name),
      nodeName: params.name,
      confName: params.confName,
      confField: params.confField,
      updating: true,
    },
    index: 0,
    timeType: params.timeType,
    start: params.start,
    end: params.end,
    children: [],
  }
}
