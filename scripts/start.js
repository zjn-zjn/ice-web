const path = require("path")
const express = require("express")
const webpack = require("webpack")
const opn = require('open')
const chalk = require('chalk')
const historyApiFallback = require('connect-history-api-fallback')

const webpackDevMiddleware = require("webpack-dev-middleware")
const webpackHotMiddleware = require("webpack-hot-middleware")
const proxy = require('http-proxy-middleware')
const webpackDevConfig = require('../config/webpack.dev')

const { choosePort } = require('./dev-utils')
const packageJson = require('../package.json')


const app = express()
const compiler = webpack(webpackDevConfig)

app.use(historyApiFallback())

app.use(webpackDevMiddleware(compiler, {
  publicPath: '/',
  logLevel: 'warn',
}))

app.use(webpackHotMiddleware(compiler, {
  log: false
}))

if (packageJson.proxy) {
  Object.keys(packageJson.proxy).forEach((context) => {
    app.use(context, proxy(packageJson.proxy[context]))
  })
}


choosePort(8888).then(
  (port) => {
    app.listen(port, () => {
      console.log(`\n项目 ${chalk.yellow(packageJson.name)} 编译成功！💐 🌸 💮 🌹 🌺 🌻 🌼 🌷 🌱 🌿 🍀`)
      console.log(`请使用浏览器访问 http://localhost:${port}/\n`)
//      opn(`http://localhost:${port}/`, {app: ['google chrome', '--incognito']})
    })
  }
)