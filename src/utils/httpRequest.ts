import axios from "axios"
import * as qs from "qs"
import { ApiServer } from "./env"

interface RequestArgs {
  headers?: object

  [propName: string]: any
}

axios.interceptors.response.use(
  (response: any) => {
    const { status, data } = response
    // 未登录
    if (status === 200 && data && typeof data === "string") {
      const nowUrl = encodeURIComponent(window.location.href)
      const loginUrl = `http:${
        ApiServer || "//http://localhost:8080"
      }/cas-server/login?locale=zh_CN&service=${nowUrl}`
      window.location.href = loginUrl
    } else {
      return response
    }
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

const baseRequest = (
  url: string,
  method: "post" | "get" | "put",
  data: any,
  args?: RequestArgs
) => {
  const isNeedBody = method === "post" || method === "put"
  // const isNeedBody = method === 'post'

  const headers = (args && args.headers) || {
    "Content-Type": "application/x-www-form-urlencodedcharset=utf-8",
  }
  const isJsonContentType = /application\/json/.test(headers["Content-Type"])
  const jsonContentTypeData = isJsonContentType
    ? { data }
    : { data: qs.stringify(data, { arrayFormat: "repeat" }) }
  const requestParams = isNeedBody ? jsonContentTypeData : { params: data }

  return axios({
    method,
    url,
    baseURL: ApiServer,
    withCredentials: true,
    headers: { ...headers },
    paramsSerializer: (params: any) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
    ...requestParams,
    ...args,
  })
}

export const GET = (url: string, args?: RequestArgs) => (data: any) =>
  baseRequest(url, "get", data, args)

export const POST = (url: string, args?: RequestArgs) => (data: any) =>
  baseRequest(url, "post", data, args)
export const PUT = (url: string, args?: RequestArgs) => (data: any) =>
  baseRequest(url, "put", data, args)
