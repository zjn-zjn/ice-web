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
  index?: number
  sonIds?: string
}

/**
 * ShowConf
 */
interface ShowConf {
  nodeId: number
  nodeType: number
  nodeName: string
  debug: boolean
  inverse: boolean
  labelName: string
  confName: string
}
