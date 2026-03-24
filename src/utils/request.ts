import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import qs from 'qs'

// 从环境变量获取 baseURL，只在开发环境中使用
const baseURL = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE_URL || '') : ''

// 创建 axios 实例
const instance = axios.create({
  baseURL,
  timeout: 120000,
  withCredentials: false,
})

interface RequestConfig extends InternalAxiosRequestConfig {
  hideErrorMessage?: boolean
}

// Message function holder - set from App component context
let showError: (msg: string) => void = (msg) => console.error(msg)

export function setMessageHandler(handler: (msg: string) => void) {
  showError = handler
}

// 请求拦截器
instance.interceptors.request.use(
  (config: RequestConfig) => {
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    if (data.ret === 0) {
      return data.data
    }
    if (!(response.config as RequestConfig).hideErrorMessage) {
      showError(data.msg || '请求失败')
    }
    return Promise.reject(data)
  },
  (error: AxiosError) => {
    if (!(error.config as RequestConfig)?.hideErrorMessage) {
      showError(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const request = {
  get: <T = any>(url: string, params?: any, config?: Partial<RequestConfig>) =>
    instance.get<any, T>(url, {
      params,
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: 'repeat' }),
      ...config,
    }),

  post: <T = any>(url: string, data?: any, config?: Partial<RequestConfig>) =>
    instance.post<any, T>(url, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    }),

  // POST with query params (for mutation endpoints that use query parameters)
  postParams: <T = any>(url: string, params?: any, config?: Partial<RequestConfig>) =>
    instance.post<any, T>(url, null, {
      params,
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: 'repeat' }),
      ...config,
    }),

}

export default request
