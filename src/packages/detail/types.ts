import type { ChildrenItem } from '../../index.d'

export interface TreeItem extends Omit<ChildrenItem, 'children'> {
  key: string
  children: TreeItem[]
}

export const RelationNodeMap = new Map([
  [1, 'AND'],
  [4, 'ANY'],
  [3, 'ALL'],
  [0, 'NONE'],
  [2, 'TRUE'],
  [9, 'P_AND'],
  [12, 'P_ANY'],
  [11, 'P_ALL'],
  [8, 'P_NONE'],
  [10, 'P_TRUE']
])

