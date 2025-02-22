import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

const AppList = lazy(() => import('../packages/app-list'))
const ConfigList = lazy(() => import('../packages/config-list'))
const Detail = lazy(() => import('../packages/detail'))

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
        <Route path="/" element={<AppList />} />
        <Route path="/config/list" element={<ConfigList />} />
        <Route path="/config/detail" element={<Detail />} />
        {/* 未匹配到路由时重定向到APP列表页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
