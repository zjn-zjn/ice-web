import React, { Component } from "react"
import { Result, Icon, Button} from "antd"

class AdminHomePage extends Component<any, any> {
  componentDidMount() {
    // console.log(this.props)
  }

  render() {
    // const { match } = this.props
    return (
      <div className="admin-home-page" style={{ marginTop: "8%" }}>
        <Result
          icon={<Icon type="smile" theme="twoTone" />}
          title="ICE配置后台"
          extra={<Button href="http://waitmoon.com/docs" size="large" type = "primary">文档</Button>}
        />
      </div>
    )
  }
}

export default AdminHomePage
