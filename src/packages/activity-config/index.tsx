import { lazy } from "react"
import models from "./models"

const AppList = lazy(() => import("./pages/appList"))
const ActivityList = lazy(() => import("./pages/configList"))
const Detail = lazy(() => import("./pages/detail"))

export default {
  models,
  routers: [
    {
      name: "APP",
      path: "/config",
      component: AppList,
    },
    {
      name: "列表",
      path: "/config/list/:id",
      component: ActivityList,
      hideInMenu: true,
      keepLive: false,
    },
    {
      name: "详情",
      path: "/config/detail/:app/:iceId",
      component: Detail,
      hideInMenu: true,
      keepLive: false,
    },
  ],
}

