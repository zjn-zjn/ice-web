import React, { useEffect, useState } from "react"
import { connect } from "dva"
import { Layout, Tabs, Icon } from "antd"
import { withRouter } from "dva/router"
import AdminMenu from "../components/menu"
import AdminBreadcrumb from "../components/breadcrumb"
// import RouteLoading from '@/components/routeLoading'
// import NotFound from '@/components/notFound'
import TabContent from "./tabContent"
import { requestFullscreen, exitFullscreen } from "@/utils/tools"

const { Content, Sider, Header } = Layout
const { TabPane } = Tabs
import "./index.scss"

const LiveAdminCommon = (props: any) => {
  const { location, dispatch, history, activeKey, tabsList } = props

  const [collapsed, setCollapsed] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    dispatch({
      type: "common/addTab",
      payload: location.pathname,
    })
    // console.log(location.pathname)
  }, [location.pathname])

  // useEffect(() => {
  //   dispatch({
  //     type: 'common/getMenu',
  //   })
  // }, [])

  const tabsEdit = (targetKey: any, action: any) => {
    if (action === "remove") {
      const nowTabList = [...tabsList]
      if (nowTabList.length <= 1 || targetKey === '/') {
        return
      }
      const tabIndex = nowTabList.findIndex((r: any) => r.path === targetKey)
      let nextActiveTab: any = {}
      if (tabIndex === nowTabList.length - 1) {
        // 删除的最后一个
        nextActiveTab = nowTabList[tabIndex - 1]
      } else {
        nextActiveTab = nowTabList[tabIndex + 1]
      }
      history.push(nextActiveTab.key, {
        tabKey: nextActiveTab.key,
      })
      nowTabList.splice(tabIndex, 1)
      dispatch({
        type: "common/_updateTabList",
        payload: nowTabList,
      })
      dispatch({
        type: "common/_updateActiveKey",
        payload: nextActiveTab.path,
      })
    }
  }

  const renderTabPane = (tabItem: any = {}) => {
    return (
      <TabPane tab={tabItem.name} key={tabItem.path}>
        <div>
          <TabContent tabItem={tabItem}></TabContent>
        </div>
      </TabPane>
    )
  }

  const onTabChanged = (key: any) => {
    const nowTabList = [...tabsList]
    const atcive = nowTabList.find((r: any) => r.path === key)
    history.push(atcive.key, { tabKey: key })
    dispatch({
      type: "common/_updateActiveKey",
      payload: key,
    })
  }

  const toggle = () => {
    setCollapsed((oldCollapsed) => !oldCollapsed)
  }

  const toggleFullscreen = () => {
    if (fullscreen) {
      exitFullscreen()
    } else {
      requestFullscreen(document.body)
    }
    setFullscreen((oldFullscreen) => !oldFullscreen)
  }

  return (
    <div className="live-admin-common">
      <Layout style={{ height: "100%", minHeight: "100%" }}>
        <Sider
          className="menu-sider"
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{ background: "rgb(0, 0, 0)"}}
        >
          <div className="logo">
            {collapsed || <span>ICE配置后台</span>}
          </div>
          <AdminMenu />
        </Sider>
        <Layout className="content-layout">
          <Header
            className="content-header"
            style={{ background: "#fff", padding: 0 }}
          >
            <div className="header-left">
              <Icon
                className="trigger"
                type={collapsed ? "menu-unfold" : "menu-fold"}
                onClick={toggle}
                style={{ fontSize: 16, marginRight: 15 }}
              />
              <AdminBreadcrumb />
            </div>
            <div className="header-right">
              <Icon
                className="trigger"
                type={fullscreen ? "fullscreen-exit" : "fullscreen"}
                style={{ fontSize: 16, marginRight: 15 }}
                onClick={toggleFullscreen}
              />
            </div>
          </Header>
          <Content className="content-body">
            {props.children}
            <Tabs
              activeKey={activeKey || "/"}
              onChange={onTabChanged}
              hideAdd
              type="editable-card"
              onEdit={tabsEdit}
            >
              {tabsList.map((tabItem: any) => renderTabPane(tabItem))}
            </Tabs>
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}

export default withRouter(
  connect(({ common }: any) => ({
    menuList: common.menuList,
    tabsList: common.tabsList,
    activeKey: common.activeKey,
  }))(LiveAdminCommon)
) as any
