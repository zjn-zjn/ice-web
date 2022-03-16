const detect = require('detect-port')
const chalk = require('chalk')

const choosePort = (port) => {
  return detect(port)
    .then(xport => {
      return new Promise(resolve => {
        if (port === xport) {
          return resolve(port)
        } else {
          console.log(chalk.yellow(`\n端口${port}被占用，已为您自动分配为端口号：${port + 1}\n`))
          return resolve(port + 1)
        }
      })
    })
    .catch(err => {
      console.log(err)
    })
}

const getEnvironmentName = () => {
  const { BUILD_ENV } = process.env
  const environmentName = {
    dev: '开发环境',
    test: '测试环境',
    prod: '生产环境',
  }

  return environmentName[BUILD_ENV]
}

module.exports = {
  choosePort,
  getEnvironmentName
}
