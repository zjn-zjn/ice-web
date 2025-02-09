import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

const Home = lazy(() => import('../packages/home'))
const AppList = lazy(() => import('../packages/app-list'))
const ConfigList = lazy(() => import('../packages/config-list'))
const Detail = lazy(() => import('../packages/detail'))
const DetailNew = lazy(() => import('../packages/detail-new'))

// 路由加载时的loading组件
const LazyLoading = () => (
  <div style={{ padding: 24, textAlign: 'center' }}>
    <Spin size="large" />
  </div>
)

const AppRouter = () => {
  return (
    <Suspense fallback={<LazyLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<AppList />} />
        <Route path="/config/list" element={<ConfigList />} />
        <Route path="/config/detail" element={<Detail />} />
        <Route path="/config/detail-new" element={<DetailNew />} />
        {/* 未匹配到路由时重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
