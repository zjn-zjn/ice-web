import type { ChildrenItem } from '../../index.d'

export interface TreeItem extends Omit<ChildrenItem, 'children'> {
  key: string
  children: TreeItem[]
}

export const RelationNodeMap = new Map([
  [0, 'NONE'],
  [1, 'AND'],
  [2, 'TRUE'],
  [3, 'ALL'],
  [4, 'ANY'],
  [8, 'P_NONE'],
  [9, 'P_AND'],
  [10, 'P_TRUE'],
  [11, 'P_ALL'],
  [12, 'P_ANY']
])

export const LeafNodeMap = new Map([
  [5, 'LEAF_FLOW'],
  [6, 'LEAF_RESULT'],
  [7, 'LEAF_NONE']
])
