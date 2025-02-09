import { Layout, Menu, Tabs } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { pathToRegexp } from 'path-to-regexp'
import logoImg from '../assets/logo.png'
import './index.less'

const { Sider, Content } = Layout

// 定义路由配置
const menuList = [
  {
    key: '/',
    label: '首页'
  },
  {
    key: '/config',
    label: '配置'
  }
]

const allTabList = [
  {
    key: '/',
    label: '首页',
    closable: false
  },
  {
    key: '/config',
    label: '配置',
    closable: true
  },
  {
    key: '/config/list',
    label: '列表',
    closable: true
  },
  {
    key: '/config/detail',
    label: '详情',
    closable: true
  }
]

const regexp = (p: string) =>
  pathToRegexp(p, [], {
    end: true,
    strict: false,
    sensitive: false
  })

interface CommonProps {
  children?: React.ReactNode
}

const Common = ({ children }: CommonProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => {
    const matchedTab = allTabList.find((item) =>
      regexp(item.key).test(location.pathname)
    ) || {
      label: '',
      key: ''
    }
    return {
      ...matchedTab,
      path: location.pathname,
      search: location.search
    }
  })

  const [tabList, setTabList] = useState(() =>
    allTabList
      .filter((item) => regexp(item.key).test(location.pathname))
      .map((item) => ({
        ...item,
        path: location.pathname,
        search: location.search
      }))
  )

  useEffect(() => {
    const currentPath = location.pathname
    const currentSearch = location.search
    const inListIndex = tabList.findIndex((item) =>
      regexp(item.key).test(currentPath)
    )

    if (inListIndex === -1) {
      const currentTab = allTabList.find((item) =>
        regexp(item.key).test(currentPath)
      )
      if (currentTab) {
        const newTab = {
          ...currentTab,
          path: currentPath,
          search: currentSearch
        }
        setTabList([...tabList, newTab])
        setActiveTab(newTab)
      }
    } else {
      const currentTab = {
        ...tabList[inListIndex],
        path: currentPath,
        search: currentSearch
      }
      setActiveTab(currentTab)
      const newTabList = [...tabList]
      newTabList[inListIndex] = currentTab
      setTabList(newTabList)
    }
  }, [location])

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleTabChange = (key: string) => {
    const targetTab = tabList.find((item) => item.key === key)
    if (targetTab) {
      navigate(targetTab.path + targetTab.search)
    }
  }

  const handleTabEdit = (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const targetIndex = tabList.findIndex((item) => item.key === targetKey)
      if (targetIndex > -1) {
        const newTabList = tabList.filter((item) => item.key !== targetKey)
        setTabList(newTabList)
        if (activeTab.key === targetKey) {
          const nextTab = newTabList[targetIndex - 1] || newTabList[0]
          if (nextTab) {
            navigate(nextTab.path + nextTab.search)
          }
        }
      }
    }
  }

  return (
    <Layout className="common-container">
      <Sider className="common-sider">
        <div className="logo">
          <img src={logoImg} alt="logo" />
          <span>ICE配置后台</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeTab.key]}
          onClick={handleMenuClick}
          items={menuList}
        />
      </Sider>
      <Layout>
        <Tabs
          className="common-tabs"
          activeKey={activeTab.key}
          onChange={handleTabChange}
          onEdit={handleTabEdit}
          type="editable-card"
          hideAdd
          items={tabList}
        />
        <Content className="common-content">
          <div className="common-page">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default Common
