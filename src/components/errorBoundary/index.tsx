import React from "react"
// import * as Sentry from "@sentry/browser"
import { Result } from "antd"

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
    this.state = { error: null }
  }

  componentDidCatch(error: any, info: any) {
    this.setState({ error })
    // Sentry.captureException(error)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div
          className="error-boundary-container"
          style={{
            textAlign: "center",
            marginTop: "8%",
            fontSize: "16px",
          }}
        >
          <Result
            status="500"
            title="页面异常"
            subTitle="对不起，页面崩溃了，请联系开发人员。"
          />
        </div>
      )
    } else {
      return this.props.children
    }
  }
}

export default ErrorBoundary
