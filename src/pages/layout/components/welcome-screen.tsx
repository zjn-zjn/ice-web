import { AppstoreOutlined } from '@ant-design/icons'

interface Props {
  type: 'no-app' | 'no-base'
}

const WelcomeScreen = ({ type }: Props) => {
  return (
    <div className="welcome-screen">
      <AppstoreOutlined className="welcome-icon" />
      {type === 'no-app' ? (
        <>
          <div>欢迎使用 Ice 规则引擎</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>请从面包屑选择或创建一个 App</div>
        </>
      ) : (
        <>
          <div>当前未选择 Rule</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>请从面包屑导航浏览并选择一个 Rule</div>
        </>
      )}
    </div>
  )
}

export default WelcomeScreen
