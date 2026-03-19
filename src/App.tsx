import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppRouter from './router'
import 'antd/dist/reset.css'
import './index.less'

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
