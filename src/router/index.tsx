import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

const MainLayout = lazy(() => import('../pages/layout'))

const LazyLoading = () => (
  <div style={{ padding: 24, textAlign: 'center' }}>
    <Spin size="large" />
  </div>
)

const AppRouter = () => {
  return (
    <Suspense fallback={<LazyLoading />}>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/app/:appId/base/*" element={<MainLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
