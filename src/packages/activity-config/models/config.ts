import { sagaUtils } from "@utils"
import Api from "../apis"
import { message } from "antd"

const { callApi, updateStateArrayWithData, updateState } = sagaUtils

const callBack = {
  process: (data: any) => {
    if(data.ret === 0){
      message.success(data.msg || 'success')
    }else if (data.ret < 0) {
      message.error(data.msg || 'failed')
    } else {
      message.error('server error')
    }
  }
}

const callOnlyFailedBack = {
  process: (data: any) => {
    if(data.ret !== 0){
      if(data.ret < 0){
        message.error(data.msg || 'failed')
      }else{
        message.error('server error')
      }
    }
  }
}

export default {
  namespace: "config",
  state: {
    appList: [],
    confList: [],
    details: {},
    confClass: [],
    pushHistory: [],
    iceExport: {},
    release:{}
  },

  subscriptions: {},

  effects: {
    appEdit: callApi(Api.appEdit, callBack),
    appList: callApi(Api.appList,callOnlyFailedBack),
    confList: callApi(Api.confList,callOnlyFailedBack),
    details: callApi(Api.details,callOnlyFailedBack),
    editConf: callApi(Api.editConf, callBack),
    getClass: callApi(Api.getClass,callOnlyFailedBack),
    pushConf: callApi(Api.pushConf, callBack),
    pushHistory: callApi(Api.pushHistory,callOnlyFailedBack),
    deleteHistory:callApi(Api.deleteHistory, callOnlyFailedBack),
    rollback: callApi(Api.rollback, callBack),
    iceEdit: callApi(Api.iceEdit, callBack),
    iceImport: callApi(Api.iceImport, callBack),
    iceExport: callApi(Api.iceExport,callOnlyFailedBack),
    iceTopro: callApi(Api.iceTopro,callBack),
    release:  callApi(Api.release, callBack),
    updateClean:callApi(Api.updateClean, callBack)
  },

  reducers: {
    _appList: updateStateArrayWithData("appList"),
    _confList: updateStateArrayWithData("confList"),
    _details: updateState("details"),
    _getClass: updateStateArrayWithData("confClass"),
    _pushHistory: updateStateArrayWithData("pushHistory"),
    _iceExport: updateState("iceExport"),
    _release: updateState("release"),
    _updateClean:updateState("updateClean"),
  },
}
