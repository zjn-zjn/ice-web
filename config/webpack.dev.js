const webpack = require('webpack')
const fs = require('fs')
const path = require('path')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.common')

const appDirectory = fs.realpathSync(process.cwd())
const resolveAppPath = relativePath => path.resolve(appDirectory, relativePath)

const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=5000&reload=true&noInfo=true'


const devWebpackConfig = merge(baseWebpackConfig, {
  mode: 'development',
  entry: [hotMiddlewareScript , resolveAppPath('src/index.tsx')],
  output: {
    path: resolveAppPath('dist'),
    publicPath: '/',
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].js',
  },
  devtool: "eval-source-map",
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
})

module.exports = devWebpackConfig 