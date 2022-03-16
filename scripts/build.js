const webpack = require('webpack')
const config = require('../config/webpack.prod')
const { getPublicPath } = require('../config/env')
const chalk = require('chalk')
const packageJson = require('../package.json')
const { getEnvironmentName } = require('./dev-utils')

const compiler = webpack(config)

console.log('\n稍等片刻，webpack正在打包🌚 🌝 🌚 🌝 🌚 🌝 🌚 🌝\n')

compiler.run((err, stats) => {
  // webpack配置错误
  if (err) {
    console.log('webpack配置错误')
    console.error(err.stack || err)
    if (err.details) {
      console.error(err.details)
    }
    return
  }

  const info = stats.toJson()

  // 编译错误
  if (stats.hasErrors()) {
    console.log('编译错误')
    console.error(info.errors)
  }

  // 编译警告
  if (stats.hasWarnings()) {
    console.warn(info.warnings)
  }

  console.log(stats.toString({
    entrypoints: false,
    modules: false,
    children: false,
  }))

  console.log(`\n项目${chalk.yellow(packageJson.name)} ${getEnvironmentName()}打包成功！👏 🎉 👏 🎉 👏 🎉`)
  console.log(`当前环境publicPath为 ${chalk.yellow(getPublicPath())}\n`)
})