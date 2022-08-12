import request from '../utils/request'

const header = {
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
}

export default {
  appList: request.GET('/ice-server/app/list'),
  appEdit: request.POST('/ice-server/app/edit', header),
  confList: request.GET('/ice-server/base/list'),
  details: request.GET('/ice-server/conf/detail'),
  editConf: request.POST('/ice-server/conf/edit', header),
  getClass: request.GET('/ice-server/conf/leaf/class'),
  pushConf: request.GET('/ice-server/base/backup'),
  pushHistory: request.GET('/ice-server/base/backup/history'),
  rollback: request.GET('/ice-server/base/rollback'),
  deleteHistory: request.GET('/ice-server/base/backup/delete'),
  iceEdit: request.POST('/ice-server/base/edit', header),
  iceExport: request.GET('/ice-server/base/export'),
  iceImport: request.POST('/ice-server/base/import', header),
  iceTopro: request.POST('/ice-server/base/pro', header),
  release: request.GET('/ice-server/conf/release', header),
  updateClean: request.GET('/ice-server/conf/update_clean', header)
}
