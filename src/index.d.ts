/**
 * AppItem
 */
interface AppItem {
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
interface ConfigItem {
  id: number
  name: string
  app: number
  scenes: string
  status: number
  confId: number
  timeType: number
  debug: number
  priority: number
  createAt: string
  updateAt: string
}

/**
 * DetailData
 */
interface DetailData {
  app: number
  confId: number
  iceId: number
  registerClients: string[]
  root: ChildrenItem
}

/**
 * ChildrenItem
 */
interface ChildrenItem {
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
  dragOver?:boolean
}

/**
 * ShowConf
 */
interface ShowConf {
  debug: boolean
  inverse: boolean
  labelName: string
  nodeId: number
  nodeType: number
  nodeName?: string
  confName?: string
  confField?: string
  haveMeta?: boolean
  nodeInfo?: NodeInfo
}

/**
 * ClassItem
 */
interface ClassItem {
  count: number
  fullName: string
  name: string
}

/**
 * NodeInfo
 */
interface NodeInfo {
  clazz: string
  desc: string
  name: string
  type: string
  iceFields: FieldItem[]
  hideFields?: FieldItem[]
}

/**
 * FieldItem
 */
interface FieldItem {
  field: string
  type: string
  name?: string
  desc?: string
  valueNull?: boolean
}
