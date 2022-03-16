import "@babel/polyfill"
import dva from "dva"
import createLoading from "dva-loading"
import App from "./app"
import models from "@/models"
import "normalize.css"
import "./groot/lib/index.css"
import { allModels } from "@/utils/getConfig"
// import * as Sentry from "@sentry/browser"
import createHistory from "history/createBrowserHistory"
// 引入antd组件相关css
import "./style.less"

import "./index.scss"

const app = dva({
  history: createHistory(),
  onError: (err: any) => {
    console.log("出错了！！！", err)
  },
})

app.use(createLoading())

models.forEach((model: any) => app.model(model))

allModels.forEach((model: any) => app.model(model))

app.router(App)

app.start("#root")

if ((module as any).hot) {
  (module as any).hot.accept()
}
