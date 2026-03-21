// 通用响应类型
export interface ApiResponse<T = any> {
  ret: number
  data: T
  msg?: string
}

/**
 * AppItem
 */
export interface AppItem {
  createAt: string
  id: number
  info: string
  name: string
  status: boolean
  updateAt: string
}

/**
 * ConfigItem
 */
export interface ConfigItem {
  id: number
  name: string
  app: number
  scenes: string
  status: number
  confId: number
  timeType: number
  debug: number
  createAt: string
  updateAt: string
}

/**
 * DetailData
 */
export interface ClientInfo {
  address: string
}

export interface ClientRegistryInfo {
  mainClients?: ClientInfo[]
  laneClients?: Record<string, ClientInfo[]>
}

export interface LeafClassInfo {
  clazz: string
  name: string
  desc?: string
  type: number
  order: number
  iceFields?: FieldItem[]
  hideFields?: FieldItem[]
}

export interface DetailData {
  app: number
  confId: number
  iceId: number
  name?: string
  root: ChildrenItem
  updateCount?: number
  clientRegistry?: ClientRegistryInfo
  leafClassMap?: Record<number, LeafClassInfo[]>
}

/**
 * ChildrenItem
 */
export interface ChildrenItem {
  showConf: ShowConf
  children?: ChildrenItem[]
  parentId?: number
  nextId?: number
  index: number
  sonIds?: string
  timeType?: number
  start?: number
  end?: number
  forwardId?: number
  forward?: ChildrenItem
  // 非接口返回字段
  isForward?: boolean
  isRoot?: boolean
  disabled?: boolean
  //组件字段
  dragOver?: boolean
}

/**
 * ShowConf
 */
export interface ShowConf {
  uniqueKey: string
  inverse: boolean
  labelName: string
  nodeId: number
  nodeType: number
  nodeName?: string
  confName?: string
  confField?: string
  haveMeta?: boolean
  nodeInfo?: NodeInfo
  updating?: boolean
  classRegistered?: boolean
}

/**
 * NodeInfo
 */
export interface NodeInfo {
  clazz: string
  desc: string
  name: string
  type: string
  iceFields?: FieldItem[]
  hideFields?: FieldItem[]
}

/**
 * FieldItem
 */
export interface FieldItem {
  field: string
  type: string
  name?: string
  desc?: string
  value: string
  valueNull: boolean
}

/**
 * Folder types
 */
export interface FolderItem {
  type: 'folder' | 'base'
  name: string
  id?: number
  confId?: number
  scenes?: string
  debug?: number
  childCount?: number
}

export interface FolderListResult {
  list: FolderItem[]
  total: number
  pageNum: number
  pageSize: number
  path: string
  actualPath: string
}

export interface FolderTreeNode {
  name: string
  path: string
  children: FolderTreeNode[]
}

export interface BatchItem {
  type: 'folder' | 'base'
  name?: string
  id?: number
  path?: string
}

/**
 * HistoryItem
 */
export interface HistoryItem {
  id: number
  app: number
  iceId: number
  reason?: string
  operator: string
  createAt: string
}
