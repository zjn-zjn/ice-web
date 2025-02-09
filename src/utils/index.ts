import qs from 'qs'

/**
 * 从 URL search string 解析查询参数
 * @param search URL search string
 * @returns 解析后的参数对象
 */
export const parseQueryString = (search: string) => {
  const searchParams = new URLSearchParams(search)
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * 将对象转换为 URL search string
 * @param params 参数对象
 * @returns URL search string
 */
export const stringifyQueryString = (params: Record<string, any>) => {
  return qs.stringify(params, { arrayFormat: 'repeat' })
}
