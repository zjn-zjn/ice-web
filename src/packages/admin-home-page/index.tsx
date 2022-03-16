import { lazy } from "react"
import models from "./models"

const AdminHomePage = lazy(() => import("./pages/homePage"))

export default {
  models,
  routers: [
    {
      name: "首页",
      path: "/",
      component: AdminHomePage,
    },
  ],
}
