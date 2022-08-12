interface AppItem {
  createAt: string
  id: number
  info: string
  name: string
  status: boolean
  updateAt: string
}

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
