import { menuList } from "@/menu"
import { pathToRegexp } from 'path-to-regexp'

const toPath = (pathStr: string) => {
  return pathStr.replace(/\-(\w)/g, (all, letter) => {
    return letter.toUpperCase()
  })
}

const breadcrumbs: any[] = [{ path: "/", breadcrumb: "首页" }]

const getRouter = (list: any[]) => {
  let routers: any[] = []
  list.forEach((li: any) => {
    if (li && li.package) {
      const lichildrens =
        require(`../packages/${li.package}`).default.routers || []
      breadcrumbs.push({ path: `/${toPath(li.package)}`, breadcrumb: li.name })
      lichildrens.forEach((liChild: any) => {
        if (liChild.path) {
          routers.push({...liChild, regexp: pathToRegexp(liChild.path, [], {
            end: true,
            strict: false,
            sensitive: false,
          })})
        }
      })
    }
    if (li.children) {
      routers = [...routers, ...getRouter(li.children)]
    }
    return li
  })
  return routers
}

const getModels = (list: any[]) => {
  let result: any[] = []
  list.forEach((li: any) => {
    if (li && li.package) {
      const limodels =
        require(`../packages/${li.package}`).default.models || []
      limodels.forEach((model: any) => {
        if (model) {
          result.push(model)
        }
      })
    }
    if (li.children) {
      result = [...result, ...getModels(li.children)]
    }

    return li
  })
  return result
}

const allRouters = getRouter(menuList)

const allBreadcrumbs = [...breadcrumbs]

const allModels = getModels(menuList)

export { allRouters, allModels, allBreadcrumbs }
