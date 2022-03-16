import React from "react"
import { Spin, Icon } from "antd"

import "./index.scss"

const antIcon = <Icon type="loading" style={{ fontSize: 18 }} spin />

const RouteLoading = () => (
  <div style={{ marginLeft: 10, marginTop: 10 }}>
    <Spin indicator={antIcon} />
    <span style={{ marginLeft: 10 }}>正在加载...</span>
  </div>
)

export default RouteLoading
