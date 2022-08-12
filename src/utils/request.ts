import axios, { AxiosRequestConfig } from 'axios'
import qs from 'qs'

interface RequestArgs {
  headers?: object
  [propName: string]: any
}

type RequestType = (url: string, args?: RequestArgs) => any

interface Request {
  GET: RequestType
  POST: RequestType
}

type Method = 'post' | 'get'

let baseArgs: AxiosRequestConfig = {
  baseURL: ''
}

axios.interceptors.response.use((response: any) => {
  return response.data
})

const baseRequest = (
  url: string,
  method: Method,
  data: any,
  args?: RequestArgs
) => {
  const isNeedBody = method === 'post'
  const headers: any = (args && args.headers) || {
    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
  }
  //支持多种content-type 数据传输
  const isJsonContentType = !/application\/x-www-form-urlencoded/.test(
    headers['Content-Type']
  )
  const jsonContentTypeData = isJsonContentType
    ? { data }
    : { data: qs.stringify(data, { arrayFormat: 'repeat' }) }
  const requestParams = isNeedBody ? jsonContentTypeData : { params: data }
  return axios({
    method,
    url,
    withCredentials: true,
    headers,
    paramsSerializer: (params: any) =>
      qs.stringify(params, { arrayFormat: 'repeat' }),
    ...requestParams,
    ...baseArgs,
    ...args
  })
}

const GET = (url: string, args?: RequestArgs) => (data?: any) =>
  baseRequest(url, 'get', data, args)

const POST = (url: string, args?: RequestArgs) => (data?: any) =>
  baseRequest(url, 'post', data, args)

export default {
  GET,
  POST
} as Request
