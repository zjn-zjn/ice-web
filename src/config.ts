import { lazy } from 'react'

const AppList = lazy(() => import('./packages/app-list'))
const ConfigList = lazy(() => import('./packages/config-list'))
const Detail = lazy(() => import('./packages/detail'))

const routers = [
  {
    label: '应用列表',
    path: '/',
    component: AppList
  },
  {
    label: '配置列表',
    path: '/config/list',
    component: ConfigList
  },
  {
    label: '配置详情',
    path: '/config/detail',
    component: Detail
  }
]

const allTabList = routers.map((item) => ({
  label: item.label,
  key: item.path
}))

const menuList = [
  {
    label: '应用列表',
    path: '/',
    key: '/'
  }
]

const breadcrumbs: any[] = []

export { menuList, breadcrumbs, routers, allTabList }
