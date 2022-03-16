import connect from "./connect"
import * as sagaUtils from "./sagaUtils"
import * as request from "./httpRequest"
import { message } from "antd"
// 修改，删除，操作相关的结果处理
const callBackAction = {
  succeed: (data: any) => {
    if (data.ret === 0) {
      message.success("success")
    } else {
      message.error((data.msg) || "failed")
    }
  },
  failed: (data: any) => {
    message.error((data.msg) || "server error")
  },
}
// 查询相关的结果处理
const callBackSeach = {
  succeed: (data: any) => {
    if (data.ret === 0) {
    } else {
      message.error((data.msg) || "search failed")
      return
    }
  },
  failed: (data: any) => {
    message.error((data.msg) || "server error")
    return
  },
}

export { callBackAction, callBackSeach, connect, sagaUtils, request }
