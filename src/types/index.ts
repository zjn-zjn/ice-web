// 通用响应类型
export interface ApiResponse<T = any> {
  ret: number
  data: T
  msg?: string
}

// App相关类型
export interface AppItem {
  id: number
  name: string
  info: string
}

// 配置相关类型
export interface ConfigItem {
  id: number
  name: string
  info: string
  createTime?: string
  updateTime?: string
  status?: number
}

// 树节点类型
export interface TreeNode {
  id: number
  name: string
  children?: TreeNode[]
  parentId?: number
  type?: number
  [key: string]: any
}

// 模态框状态类型
export interface ModalState {
  visible: boolean
  [key: string]: any
}

// 分页参数类型
export interface PaginationParams {
  current?: number
  pageSize?: number
  total?: number
}
