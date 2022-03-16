const { BUILD_ENV = "prod" } = process.env
const apiServerList = {
  test: "/",
  prod: "/",
}

const ApiServer = apiServerList[BUILD_ENV]

export { ApiServer }
