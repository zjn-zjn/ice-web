import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Common from './common'
import AppRouter from './router'
import 'antd/dist/reset.css'
import './index.less'

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Common>
          <AppRouter />
        </Common>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
