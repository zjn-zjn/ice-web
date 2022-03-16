// 处理数组，生成面包屑映射
const createBreadcrumbsMap = (arr: any[]) => {
  const ret: any[] = []
  const toArr = (ar: any[]) => {
    ar.forEach((item: any) => {
      if (item.router || item.path) {
        ret.push({
          path: item.router || item.path,
          breadcrumb: item.breadcrumb || item.name,
        })
      }
      if (item.childMenu instanceof Array) {
        toArr(item.childMenu)
      }
    })
  }
  toArr(arr)
  return ret
}

// 全屏
const requestFullscreen = (ele: any) => {
  if (ele.requestFullscreen) {
    ele.requestFullscreen()
  } else if (ele.mozRequestFullScreen) {
    ele.mozRequestFullScreen()
  } else if (ele.webkitRequestFullscreen) {
    ele.webkitRequestFullscreen()
  } else if (ele.msRequestFullscreen) {
    ele.msRequestFullscreen()
  }
}

const exitFullscreen = () => {
  const doc = document as any
  if (doc.exitFullScreen) {
    doc.exitFullScreen()
  } else if (doc.mozCancelFullScreen) {
    doc.mozCancelFullScreen()
  } else if (doc.webkitExitFullscreen) {
    doc.webkitExitFullscreen()
  } else if (doc.msExitFullscreen) {
    doc.msExitFullscreen()
  }
}

export { createBreadcrumbsMap, requestFullscreen, exitFullscreen }
