import { Result, Button } from 'antd'
import { SmileOutlined } from '@ant-design/icons'

const Home = () => {
  return (
    <div className='admin-home-page' style={{ marginTop: '8%' }}>
      <Result
        icon={<SmileOutlined />}
        title='ICE配置后台'
        extra={
          <Button href='http://waitmoon.com/zh' size='large' type='primary'>
            文档
          </Button>
        }
      />
    </div>
  )
}

export default Home
