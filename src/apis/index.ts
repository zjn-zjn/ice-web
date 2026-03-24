import request from '../utils/request'
import type { DetailData, FolderListResult, FolderTreeNode, BatchItem, ChildrenItem, ApiResponse, AppItem, ConfigItem, HistoryItem } from '../types'

const API_PREFIX = '/ice-server'

export type { ApiResponse }

export interface EditConfResponse {
  nodeId: number
  nodes?: ChildrenItem[]
}

interface ConfigListResponse {
  list: ConfigItem[]
  total: number
}

interface ConfListParams {
  app?: number
  pageNum?: number
  pageSize?: number
  name?: string
}

interface EditConfParams {
  app: number
  iceId: number
  editType: number
  selectId?: number
  parentId?: number
  nextId?: number
  index?: number
  nodeType?: number
  relationType?: number
  confName?: string
  confField?: string
  name?: string
  multiplexIds?: string
  moveTo?: number
  moveToParentId?: number
  moveToNextId?: number
  lane?: string
  inverse?: boolean
  timeType?: number
  start?: number
  end?: number
}

interface IceCreateParams {
  app: number
  name?: string
  scenes?: string
  debug?: number
  id?: number
  path?: string
}

interface IceEditParams {
  app: number
  id: number
  name?: string
  scenes?: string
  debug?: number
}

interface ReleaseParams {
  app: number
  iceId: number
}

interface PublishTarget {
  name: string
  url: string
}

interface ConfigInfoResponse {
  mode: string
  publishTargets?: PublishTarget[]
}

const apis = {
  configInfo: () =>
    request.get<ConfigInfoResponse>(`${API_PREFIX}/config/info`),

  publish: (data: { json: string; target: string }) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/publish`, data),

  appList: (params?: { pageNum?: number; pageSize?: number; name?: string; app?: number }) =>
    request.get<{ list: AppItem[]; total: number; pageNum: number; pageSize: number }>(`${API_PREFIX}/app/list`, params),

  appEdit: (data: Partial<AppItem>) =>
    request.post<ApiResponse>(`${API_PREFIX}/app/edit`, data),

  confList: (params?: ConfListParams) =>
    request.get<ConfigListResponse>(`${API_PREFIX}/base/list`, params),

  details: (params: { app: number, iceId: number, address?: string, lane?: string }) =>
    request.get<DetailData>(`${API_PREFIX}/conf/detail`, params, { hideErrorMessage: true }),

  nodeMeta: (params: { app: string | number, lane?: string, address?: string }) =>
    request.get<any>(`${API_PREFIX}/conf/node-meta`, params),

  editConf: (data: EditConfParams) =>
    request.post<EditConfResponse>(`${API_PREFIX}/conf/edit`, data),

  getLanes: (params: { app: string | number }) =>
    request.get<string[]>(`${API_PREFIX}/conf/lane/list`, params),

  pushConf: (params: { iceId: string | number, app: string | number, reason?: string }) =>
    request.postParams(`${API_PREFIX}/base/backup`, params),

  pushHistory: (params: { app: string | number, iceId: string | number }) =>
    request.get<{ list: HistoryItem[] }>(`${API_PREFIX}/base/backup/history`, params),

  rollback: (params: { app: string | number, pushId: number }) =>
    request.postParams(`${API_PREFIX}/base/rollback`, params),

  deleteHistory: (params: { app: string | number, pushId: number }) =>
    request.postParams(`${API_PREFIX}/base/backup/delete`, params),

  iceCreate: (data: IceCreateParams) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/create`, data),

  iceEdit: (data: IceEditParams) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/edit`, data),

  iceDelete: (params: { app: number, id: number }) =>
    request.postParams(`${API_PREFIX}/base/delete`, params),

  iceExport: (params: { iceId: string | number, app: string | number, pushId?: number }) =>
    request.get<string>(`${API_PREFIX}/base/export`, params),

  iceExportBatch: (params: { iceIds: (string | number)[], app: string | number }) =>
    request.get<string>(`${API_PREFIX}/base/export/batch`, params),

  iceImport: (json: string) =>
    request.post<ApiResponse>(`${API_PREFIX}/base/import`, { json }),

  release: (params: ReleaseParams) =>
    request.postParams<ApiResponse>(`${API_PREFIX}/conf/release`, params),

  updateClean: (params: ReleaseParams) =>
    request.postParams<ApiResponse>(`${API_PREFIX}/conf/update_clean`, params),

  // Folder APIs
  folderCreate: (data: { app: number; path: string; name: string }) =>
    request.post(`${API_PREFIX}/folder/create`, data),

  folderRename: (data: { app: number; path: string; newName: string }) =>
    request.post(`${API_PREFIX}/folder/rename`, data),

  folderDelete: (data: { app: number; path: string }) =>
    request.post<{ folderCount: number; baseCount: number }>(`${API_PREFIX}/folder/delete`, data),

  folderMove: (data: { app: number; path: string; targetPath: string }) =>
    request.post(`${API_PREFIX}/folder/move`, data),

  folderTree: (params: { app: number }) =>
    request.get<FolderTreeNode[]>(`${API_PREFIX}/folder/tree`, params),

  folderList: (params: { app: number; path?: string; pageNum: number; pageSize: number; name?: string }) =>
    request.get<FolderListResult>(`${API_PREFIX}/folder/list`, params),

  // Batch operations
  batchMove: (data: { app: number; items: BatchItem[]; targetPath: string }) =>
    request.post(`${API_PREFIX}/base/batch/move`, data),

  batchDelete: (data: { app: number; items: BatchItem[] }) =>
    request.post(`${API_PREFIX}/base/batch/delete`, data),

  exportFolder: (params: { app: number; path: string }) =>
    request.get<string>(`${API_PREFIX}/base/export/folder`, params),

  // Mock APIs
  mockExecute: (data: { app: number; iceId?: number; confId?: number; scene?: string; ts?: number; roam?: Record<string, any>; target: string }) =>
    request.post<any>(`${API_PREFIX}/mock/execute`, data, { timeout: 60000 }),

  mockSchema: (params: { app: number; iceId?: number; confId?: number; lane?: string; address?: string }) =>
    request.get<any>(`${API_PREFIX}/mock/schema`, params),
}

export default apis
