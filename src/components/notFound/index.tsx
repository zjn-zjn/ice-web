import React, { Component } from "react"
import { Result } from "antd"

class NotFound extends Component<any, any> {
  render() {
    return (
      <div style={{ marginTop: "8%" }}>
        <Result
          status="404"
          title="404"
          subTitle="对不起，你访问的页面暂时不存在。"
          // extra={<Button type="primary">Back Home</Button>}
        />
      </div>
    )
  }
}

export default NotFound
