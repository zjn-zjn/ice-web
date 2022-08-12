import Common from './common'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/antd.min.css'
import './index.less'

function App() {
  return (
    <BrowserRouter>
      <Common />
    </BrowserRouter>
  )
}

export default App
