import { lazy } from 'react'

const Home = lazy(() => import('./packages/home'))
const AppList = lazy(() => import('./packages/app-list'))
const ConfigList = lazy(() => import('./packages/config-list'))
const Detail = lazy(() => import('./packages/detail'))

const routers = [
  {
    label: '首页',
    path: '/',
    component: Home
  },
  {
    label: 'APP',
    path: '/config',
    component: AppList
  },
  {
    label: '列表',
    path: '/config/list',
    component: ConfigList
  },
  {
    label: '详情',
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
    label: '首页',
    path: '/',
    key: '/'
  },
  {
    label: '配置',
    path: '/config',
    key: '/config'
  }
]

const breadcrumbs: any[] = []

export { menuList, breadcrumbs, routers, allTabList }
