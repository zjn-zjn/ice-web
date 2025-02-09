import request from '../utils/request'

const API_PREFIX = '/ice-server'

// 定义API响应类型
interface ApiResponse<T = any> {
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

// 创建API请求函数
const apis = {
  // App相关
  appList: () => 
    request.get<ApiResponse<{ list: AppItem[] }>>(`${API_PREFIX}/app/list`),
  
  appEdit: (data: Partial<AppItem>) =>
    request.post<ApiResponse>(`${API_PREFIX}/app/edit`, data),

  // 配置相关
  confList: (params?: any) =>
    request.get<ApiResponse<ConfigListResponse>>(`${API_PREFIX}/base/list`, params),
  
  details: (params: { id: string | number }) =>
    request.get<ApiResponse>(`${API_PREFIX}/conf/detail`, params),
  
  editConf: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/conf/edit`, data),
  
  getClass: (params?: any) =>
    request.get<ApiResponse>(`${API_PREFIX}/conf/leaf/class`, params),
  
  // 备份相关
  pushConf: (params: { id: string | number }) =>
    request.get<ApiResponse>(`${API_PREFIX}/base/backup`, params),
  
  pushHistory: (params: { id: string | number }) =>
    request.get<ApiResponse>(`${API_PREFIX}/base/backup/history`, params),
  
  rollback: (params: { id: string | number }) =>
    request.get<ApiResponse>(`${API_PREFIX}/base/rollback`, params),
  
  deleteHistory: (params: { id: string | number }) =>
    request.get<ApiResponse>(`${API_PREFIX}/base/backup/delete`, params),
  
  // ICE相关
  iceEdit: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/edit`, data),
  
  iceExport: (params: { id: string | number }) =>
    request.get<ApiResponse>(`${API_PREFIX}/base/export`, params),
  
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
