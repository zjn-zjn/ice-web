const webpack = require('webpack')
const fs = require('fs')
const path = require('path')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.common')
const TerserPlugin = require('terser-webpack-plugin') // 压缩
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin") // 压缩css
const MiniCssExtractPlugin = require("mini-css-extract-plugin") // 提取css
const { CleanWebpackPlugin } = require('clean-webpack-plugin') // 删除文件夹
const { getPublicPath } = require('./env')
const packageJson = require('../package.json')

const appDirectory = fs.realpathSync(process.cwd())
const resolveAppPath = relativePath => path.resolve(appDirectory, relativePath)

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const prodWebpackConfig = merge(baseWebpackConfig, {
  mode: 'production',
  entry: resolveAppPath('src/index.tsx'),
  devtool: false,
  output: {
    path: resolveAppPath('dist'),
    publicPath: getPublicPath(),
    filename: 'js/[name].[chunkhash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].js',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        // sourceMap: false,
        extractComments: false,
      }),
      new OptimizeCSSAssetsPlugin({})
    ],
    runtimeChunk: 'single',
    namedModules: true,
    namedChunks: true,
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                require('postcss-flexbugs-fixes'),
                require('autoprefixer'),
              ],
            },
          },
          'sass-loader',
        ]
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    // new BundleAnalyzerPlugin(),

    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash:8].css",
      chunkFilename: "css/[name].[contenthash:8].css"
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.IgnorePlugin(/\.\/locale/, /moment/), // 忽略moment的语言包打包
  ],
  resolve: {
    alias: {
      '@ant-design/icons/lib/dist$': path.resolve(
        __dirname,
        '../src/antd-icons.js'
      )
  }
  },
//  externals:{
//    'antd': 'antd',
//    'moment':'moment',
//    'react':'React',
//    'react-dom':'ReactDOM'
//  }
})

module.exports = prodWebpackConfig