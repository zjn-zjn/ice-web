import React, { Suspense } from "react"
import { withRouter } from "dva/router"
import NotLiveRoute from "react-live-route"
// import RouteLoading from '@/components/routeLoading'

const LiveRoute = withRouter(NotLiveRoute)

const TabContent = (props: any) => {
  const { tabItem } = props

  // const Component = lazy(tabItem.component)

  return (
    <div>
      <Suspense fallback={null}>
        <LiveRoute
          path={tabItem.path}
          // alwaysLive={true}
          forceUnmount={typeof(tabItem.keepLive) === 'function' ? tabItem.keepLive() : () => tabItem.keepLive}
          component={tabItem.component}
        />
      </Suspense>
    </div>
  )
}

export default TabContent
