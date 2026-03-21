import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppRouter from './router'
import { ThemeProvider, useTheme } from './theme/ThemeContext'
import { setMessageHandler } from './utils/request'
import 'antd/dist/reset.css'
import './index.less'

const MessageBridge = () => {
  const { message } = AntdApp.useApp()
  useEffect(() => {
    setMessageHandler((msg) => message.error(msg))
  }, [message])
  return null
}

const ThemedApp = () => {
  const { isDark } = useTheme()
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <MessageBridge />
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  )
}

export default App
