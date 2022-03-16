const packageJson = require('../package.json')

const getEnvironment = () => {
  const processEnv = {
    NODE_ENV: process.env.NODE_ENV,
    BUILD_ENV: process.env.BUILD_ENV, // 当前打包构建的环境
  }

  const stringProcessEnv = {
    'process.env': Object.keys(processEnv).reduce(
      (env, key) => {
        env[key] = JSON.stringify(processEnv[key])
        return env
      },
      {}
    ),
  }

  return stringProcessEnv
}

const getPublicPath = () => {
  const { BUILD_ENV } = process.env
  const publicUrlList = {
    dev: '/',
    test: '/',
    prod: '/'
  }

  return (publicUrlList[BUILD_ENV] || '/')
}

module.exports = { getEnvironment, getPublicPath }