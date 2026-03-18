import request from '../utils/request'
import type { DetailData } from '../index.d'

const API_PREFIX = '/ice-server'

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

interface ConfigListResponse {
  list: any[]
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

const apis = {
  appList: () => 
    request.get<{ list: AppItem[] }>(`${API_PREFIX}/app/list`),
  
  appEdit: (data: Partial<AppItem>) =>
    request.post<ApiResponse>(`${API_PREFIX}/app/edit`, data),

  confList: (params?: any) =>
    request.get<ConfigListResponse>(`${API_PREFIX}/base/list`, params),
  
  details: (params: { app: number, iceId: number, address?: string, lane?: string }) =>
    request.get<DetailData>(`${API_PREFIX}/conf/detail`, params),

  nodeMeta: (params: { app: string | number, lane?: string, address?: string }) =>
    request.get<any>(`${API_PREFIX}/conf/node-meta`, params),
  
  editConf: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/conf/edit`, data),
  
  getLanes: (params: { app: string | number }) =>
    request.get<string[]>(`${API_PREFIX}/conf/lane/list`, params),
  
  pushConf: (params: { iceId: string | number, app: string | number, reason?: string }) =>
    request.get(`${API_PREFIX}/base/backup`, params),
  
  pushHistory: (params: { app: string | number, iceId: string | number }) =>
    request.get<{ list: HistoryItem[] }>(`${API_PREFIX}/base/backup/history`, params),
  
  rollback: (params: { app: string | number, pushId: number }) =>
    request.get(`${API_PREFIX}/base/rollback`, params),
  
  deleteHistory: (params: { app: string | number, pushId: number }) =>
    request.get(`${API_PREFIX}/base/backup/delete`, params),
  
  iceCreate: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/create`, data),

  iceEdit: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/edit`, data),
  
  iceExport: (params: { iceId: string | number, app: string | number, pushId?: number }) =>
    request.get<string>(`${API_PREFIX}/base/export`, params),

  iceExportBatch: (params: { iceIds: (string | number)[], app: string | number }) =>
    request.get<string>(`${API_PREFIX}/base/export/batch`, params),
  
  iceImport: (data: any) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/import`, data),
  
  release: (params?: any) =>
    request.get<ApiResponse>(`${API_PREFIX}/conf/release`, params),
  
  updateClean: (params?: any) =>
    request.get<ApiResponse>(`${API_PREFIX}/conf/update_clean`, params)
}

export default apis
