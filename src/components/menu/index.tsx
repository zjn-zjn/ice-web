import React, { useEffect, useState } from "react"
import { Menu, Icon } from "antd"
const { SubMenu, Item: MenuItem } = Menu
import menuData from "@/menu"
import { connect } from "dva"
import { withRouter } from "dva/router"

import "./index.scss"

export interface MenuListItem {
  children?: MenuList
  path?: number
  name: string
  [propName: string]: any
}

export type MenuList = MenuListItem[]

const getMenu = (list: any[]) => {
  let result = []
  result = list.map((li: any) => {
    if (li && li.package) {
      const lichildrens =
        require(`../../packages/${li.package}`).default.routers || []
      const resultChild: any[] = []
      lichildrens.forEach((liChild: any) => {
        if (!liChild.hideInMenu) {
          resultChild.push({
            name: liChild.name,
            path: liChild.path,
          })
        }
      })
      if (li.isLeaf) {
        // 叶子节点
        li.path = resultChild[0] && resultChild[0].path
      } else {
        li.children = resultChild
      }
    }
    if (li.children) {
      li.children = getMenu(li.children)
    }

    return li
  })
  return result
}

const findMenu = (list: any[], key: any) => {
  let result: any = null
  const findResult = (lists: any[], keys: any) => {
    const r = lists.find((li: any) => li.path === keys)
    if (r) {
      result = r
      return
    } else {
      lists.forEach((li: any) => {
        if (li.children && li.children.length > 0) {
          findResult(li.children, keys)
        }
      })
    }
  }
  findResult(list, key)
  return result
}

const findSubMenus = (list: any[], key: any) => {
  let subMenu: any[] = []
  const findS = (lists: any[], keys: any, subMenus: any = []) => {
    lists.forEach((li: any) => {
      subMenus.push(li.path || li.name)
      if (li.children && li.children.length > 0) {
        const finKey = li.children.find((chLi: any) => chLi.path === keys)
        if (finKey) {
          subMenu = subMenus
        } else {
          findS(li.children, keys, subMenus)
        }
      }
    })
  }

  findS(list, key)
  return subMenu
}

const AdminMenu = (props: any) => {
  const [menuList, setMenuList] = useState<any[]>([])
  const [openKeys, setOpenKeys] = useState<any[]>([])
  const [selectedKeys, setSelectedKeys] = useState<any[]>([])

  const { history, dispatch, activeKey } = props
  const listData = getMenu(menuData)

  useEffect(() => {
    setMenuList(listData)
  }, [])

  useEffect(() => {
    const isInMenu = findMenu(listData, activeKey)
    const subMenus = findSubMenus(listData, activeKey)
    if (isInMenu) {
      setSelectedKeys([activeKey])
      setOpenKeys(subMenus)
    }
  }, [activeKey])

  const renderMenu = (list: MenuList) => {
    return (
      list.length > 0 &&
      list.map((listItem: MenuListItem) => {
        const { name, children, path, icon } = listItem
        if (children && children.length > 0) {
          return (
            <SubMenu
              key={path || name}
              title={
                <span>
                  {icon && <Icon type={icon} />}
                  <span>{name}</span>
                </span>
              }
              onTitleClick={path ? onChange : () => {}}
            >
              {renderMenu(children)}
            </SubMenu>
          )
        } else {
          return (
            <MenuItem key={path || name} className="menu-item">
              <span>
                {icon && <Icon type={icon} />}
                <span>{name}</span>
              </span>
            </MenuItem>
          )
        }
      })
    )
  }

  const onChange = (menuMsg: any) => {
    history.push(menuMsg.key, {
      tabKey: menuMsg.key,
    })
    dispatch({
      type: "common/addTab",
      payload: menuMsg.key,
    })
  }

  const onSelect = (a: any) => {
    // console.log(a)
  }

  return (
    <Menu
      // defaultSelectedKeys={defaultSelected}
      onClick={onChange}
      theme="dark"
      mode="inline"
      selectedKeys={selectedKeys}
      onSelect={onSelect}
      defaultOpenKeys={openKeys}
    >
      {renderMenu(menuList)}
    </Menu>
  )
}

export default connect(({ common }: any) => ({
  tabsList: common.tabsList,
  activeKey: common.activeKey,
}))(withRouter(AdminMenu))
