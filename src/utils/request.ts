import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import qs from 'qs'
import { message } from 'antd'

// 从环境变量获取 baseURL，只在开发环境中使用
const baseURL = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE_URL || '') : ''

// 创建 axios 实例
const instance = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: false,
})

interface ApiResponse<T = any> {
  ret: number
  data: T
  msg?: string
}

interface RequestConfig extends InternalAxiosRequestConfig {
  hideErrorMessage?: boolean
}

// 请求拦截器
instance.interceptors.request.use(
  (config: RequestConfig) => {
    // 可以在这里添加token等认证信息
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
      message.error(data.msg || '请求失败')
    }
    return Promise.reject(data)
  },
  (error: AxiosError) => {
    if (!(error.config as RequestConfig)?.hideErrorMessage) {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const request = {
  get: <T = any>(url: string, params?: any, config?: RequestConfig) =>
    instance.get<any, T>(url, {
      params,
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: 'repeat' }),
      ...config,
    }),

  post: <T = any>(url: string, data?: any, config?: RequestConfig) =>
    instance.post<any, T>(url, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    }),

  form: <T = any>(url: string, data?: any, config?: RequestConfig) =>
    instance.post<any, T>(url, qs.stringify(data, { arrayFormat: 'repeat' }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      ...config,
    }),
}

export default request
