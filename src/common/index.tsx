import { Layout, Menu, Tabs } from 'antd'
import logoImg from '../assets/logo.png'
import { routers, menuList, allTabList } from '../config'
import { Suspense, useEffect, useState } from 'react'
import CacheRoute, {
  CacheSwitch,
  dropByCacheKey
} from 'react-router-cache-route'
import { useHistory } from 'react-router-dom'
import { pathToRegexp } from 'path-to-regexp'
import './index.less'

const { Sider, Content } = Layout

const regexp = (p: string) =>
  pathToRegexp(p, [], {
    end: true,
    strict: false,
    sensitive: false
  })

const Common = () => {
  const history = useHistory()
  const [activeTab, setActiveTab] = useState(() => ({
    ...(allTabList.find((item) =>
      regexp(item.key).test(history.location.pathname)
    ) || {
      label: '',
      key: ''
    }),
    path: history.location.pathname,
    search: window.location.search
  }))

  const [tabList, setTabList] = useState(() =>
    allTabList
      .filter((item) => regexp(item.key).test(history.location.pathname))
      .map((item) => ({
        ...item,
        path: history.location.pathname,
        search: window.location.search
      }))
  )

  useEffect(() => {
    const unListen = history.listen((location) => {
      const currentPath = location.pathname
      const currentSearch = window.location.search
      const inListIndex = tabList.findIndex((item) =>
        regexp(item.key).test(currentPath)
      )
      const foundTabItem = allTabList.find((item) =>
        regexp(item.key).test(currentPath)
      )
      if (foundTabItem) {
        const newTabItem = {
          ...foundTabItem,
          path: currentPath,
          search: currentSearch
        }
        setActiveTab(newTabItem)
        if (inListIndex === -1) {
          setTabList((pre) => [...pre, newTabItem])
        } else if (tabList[inListIndex].search !== currentSearch) {
          setTabList((pre) =>
            pre.map((item, i) => (i !== inListIndex ? item : newTabItem))
          )
        }
      }
    })
    return unListen
  }, [tabList])

  const onMenuClick = ({ key }: { key: string }) => {
    history.push(key)
  }

  const onTabChange = (key: string) => {
    const tabItem = tabList.find((item) => item.key === key)
    if (tabItem) {
      history.push(`${tabItem.path}${tabItem.search}`)
    }
  }

  const onTabEdit = (
    key: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove'
  ) => {
    if (action === 'remove') {
      if (tabList.length <= 1) {
        return
      }
      const newTabList = [...tabList]
      for (let i = 0; i < newTabList.length; i++) {
        if (newTabList[i].key === key) {
          dropByCacheKey(newTabList[i].key)
          newTabList.splice(i, 1)
          setTabList(newTabList)
          if (activeTab.key === key) {
            const { path, search } = newTabList[i + 1] || newTabList[i - 1]
            history.push(`${path}${search}`)
          }
          break
        }
      }
    }
  }

  return (
    <Layout className='admin-common'>
      <Sider className='sider'>
        <div className='logo'>
          <img alt='' src={logoImg} />
          <span>ICE配置后台</span>
        </div>
        <Menu
          mode='inline'
          items={menuList}
          theme='dark'
          onClick={onMenuClick}
          selectedKeys={[activeTab.key]}
        />
      </Sider>
      <Layout className='content-layout'>
        <div className='header'>
          <Tabs
            hideAdd
            type='editable-card'
            activeKey={activeTab.key}
            onChange={onTabChange}
            onEdit={onTabEdit}
          >
            {tabList.map((tab) => (
              <Tabs.TabPane tab={tab.label} key={tab.key} />
            ))}
          </Tabs>
        </div>
        <Content className='content'>
          <Suspense fallback={null}>
            <CacheSwitch>
              {routers.map((item) => (
                <CacheRoute
                  className='wrap'
                  key={item.path}
                  path={item.path}
                  cacheKey={item.path}
                  component={item.component}
                  exact
                />
              ))}
            </CacheSwitch>
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  )
}

export default Common
