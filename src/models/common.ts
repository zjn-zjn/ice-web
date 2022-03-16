// import { sagaUtils } from "@utils"
import { allRouters } from "@/utils/getConfig"

// const { callApi, updateStateArrayWithData } = sagaUtils

export default {
  namespace: "common",
  state: {
    menuList: [],
    tabsList: [allRouters.find((r: any) => r.path === "/")],
    activeKey: "/",
  },

  subscriptions: {},

  effects: {
    addTab: function* (action: any, { put, select }: any) {
      const { payload } = action
      const { tabsList } = yield select((sta: any) => sta.common)
      let nowTabList = [...tabsList]
      const activeRouter = allRouters.find((r: any) => r.regexp.test(payload))
      const isInTab = nowTabList.find((r: any) => r.regexp.test(payload))
      const newActiveRouter = {...activeRouter, key: payload}
      if (isInTab) {
        // 当前路径已经在tab里了
        nowTabList = nowTabList.map((tab: any) => {
          if (tab.path === activeRouter.path) {
            return {...tab, key: payload}
          } else {
            return tab
          }
        })
        yield put({
          type: "_updateTabList",
          payload: [...nowTabList],
        })
      } else {
        // 新增一个tab
        yield put({
          type: "_updateTabList",
          payload: [...nowTabList, newActiveRouter],
        })
      }
      yield put({ type: "_updateActiveKey", payload: newActiveRouter.path })
    },
  },

  reducers: {
    _updateTabList: (state: any, action: any) => ({
      ...state,
      tabsList: action.payload,
    }),
    _updateActiveKey: (state: any, action: any) => ({
      ...state,
      activeKey: action.payload,
    }),
  },
}
