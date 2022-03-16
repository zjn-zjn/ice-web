import React from "react"
import { Link } from "react-router-dom"
import withBreadcrumbs from "react-router-breadcrumbs-hoc"
import { Breadcrumb } from "antd"
import { allBreadcrumbs, allRouters } from "@/utils/getConfig"

const BreadcrumbItem = Breadcrumb.Item

const PureBreadcrumbs = ({ breadcrumbs }: any) => (
  <div>
    <Breadcrumb>
      {breadcrumbs.map(({ breadcrumb, match }: any, index: number) => (
        <BreadcrumbItem className="bc" key={match.url}>
          {breadcrumbs.length - 1 === index ||
          // (match.url.split('/').length === 2 && match.url.split('/')[1] !== '')) ?
          allBreadcrumbs.find((b: any) => match.url === b.path) ? (
            <span>{breadcrumb}</span>
          ) : (
            <Link style={{ color: "#1890ff" }} to={match.url || ""}>
              {breadcrumb}
            </Link>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  </div>
)

const Breadcrumbs = () => {
  const breadcrumbsMap = [
    ...allBreadcrumbs,
    ...allRouters.map((router: any) => ({
      path: router.path,
      breadcrumb: router.name,
    })),
  ]

  const ReNameBreadcrumbs = withBreadcrumbs(breadcrumbsMap)(PureBreadcrumbs)

  return <ReNameBreadcrumbs />
}

export default Breadcrumbs
