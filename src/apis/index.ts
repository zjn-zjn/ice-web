import request from '../utils/request'
import type { DetailData, ChildrenItem } from '../index.d'

const API_PREFIX = '/ice-server'

// 定义API响应类型
export interface ApiResponse<T = any> {
  ret: number
  data: T
  msg?: string
}

interface AppItem {
  id: number
  name: string
  info: string
}

interface ConfigItem {
  id: number
  name: string
  scenes: string
  confId: string
  debug: string
  [key: string]: any
}

interface ConfigListResponse {
  list: ConfigItem[]
  total: number
}

interface HistoryItem {
  id: number
  app: number
  iceId: number
  reason?: string
  operator: string
  createAt: string
}

interface ClassItem {
  count: number
  fullName: string
  name: string
}

// 创建API请求函数
const apis = {
  // App相关
  appList: () => 
    request.get<{ list: AppItem[] }>(`${API_PREFIX}/app/list`),
  
  appEdit: (data: Partial<AppItem>) =>
    request.post<ApiResponse>(`${API_PREFIX}/app/edit`, data),

  // 配置相关
  confList: (params?: any) =>
    request.get<ConfigListResponse>(`${API_PREFIX}/base/list`, params),
  
  details: (params: { app: number, iceId: number, address?: string }) =>
    request.get<DetailData>(`${API_PREFIX}/conf/detail`, params),
  
  editConf: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/conf/edit`, data),
  
  getClass: (params: { app: string | number, type: number }) =>
    request.get<ClassItem[]>(`${API_PREFIX}/conf/leaf/class`, params),
  
  // 备份相关
  pushConf: (params: { iceId: string | number, app: string | number, reason?: string }) =>
    request.get(`${API_PREFIX}/base/backup`, params),
  
  pushHistory: (params: { app: string | number, iceId: string | number }) =>
    request.get<{ list: HistoryItem[] }>(`${API_PREFIX}/base/backup/history`, params),
  
  rollback: (params: { pushId: number }) =>
    request.get(`${API_PREFIX}/base/rollback`, params),
  
  deleteHistory: (params: { pushId: number }) =>
    request.get(`${API_PREFIX}/base/backup/delete`, params),
  
  // ICE相关
  iceEdit: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/edit`, data),
  
  iceExport: (params: { iceId: string | number, app: string | number }) =>
    request.get<string>(`${API_PREFIX}/base/export`, params),
  
  iceImport: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/import`, data),
  
  iceTopro: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/pro`, data),
  
  // 其他
  release: (params?: any) =>
    request.get<ApiResponse>(`${API_PREFIX}/conf/release`, params),
  
  updateClean: (params?: any) =>
    request.get<ApiResponse>(`${API_PREFIX}/conf/update_clean`, params)
}

export default apis
