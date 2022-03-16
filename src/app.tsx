import React from "react"
import { BrowserRouter as Router } from "dva/router"
import { ConfigProvider } from "antd"
import zhCN from "antd/lib/locale-provider/zh_CN"
import LiveAdminCommon from "@/common"
import moment from "moment"
import "moment/locale/zh-cn"
import ErrorBoundary from "@/components/errorBoundary"

moment.locale("zh-cn")

const { BUILD_ENV = "prod" } = process.env

const App = (props: any) => (
  <ErrorBoundary>
    <ConfigProvider locale={zhCN}>
      <Router
        basename={BUILD_ENV === "dev" ? "/" : "/"}
      >
        <LiveAdminCommon />
      </Router>
    </ConfigProvider>
  </ErrorBoundary>
)

export default App
