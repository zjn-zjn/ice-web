const path = require("path")
const fs = require('fs')
const webpack = require('webpack')
const { getEnvironment } = require('./env')

const HtmlWebpackPlugin = require('html-webpack-plugin') // html
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin') // 在单独的进程上运行typescript类型检查器

const appDirectory = fs.realpathSync(process.cwd())
const resolveAppPath = relativePath => path.resolve(appDirectory, relativePath)

module.exports = {
  stats: {
    entrypoints: false,
    modules: false,
    children: false,
  },
  performance: {
    hints: false
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs)$/,
        include: resolveAppPath('src'),
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        }
      },
      {
        test: /\.(tsx|ts)?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      // {
      //   test: /\.(js|tsx|ts)?$/,
      //   use: 'ts-loader',
      //   exclude: /(node_modules|package\/admin-new-gift)/,
      // },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
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
      {
        test: /\.less$/,
        use: [{
          loader: 'style-loader',
        },
        {
          loader: 'css-loader', // translates CSS into CommonJS
        },
        {
          loader: 'less-loader', // compiles Less to CSS
          options: {
            modifyVars: {
              // 'primary-color': '#1DA57A',
              // 'link-color': '#1DA57A',
              // 'border-radius-base': '2px',
              // or
              // 'hack': `true; @import "your-less-file-path.less";`, // Override with less file
            },
            javascriptEnabled: true,
          },
        }],
      },
      {
        test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz|svga)(\?.+)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'assets/[name].[hash:8].[ext]',
        },
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: resolveAppPath('public/index.html')
    }),
    new webpack.DefinePlugin(getEnvironment()),
    new ForkTsCheckerWebpackPlugin({ // tslint报错在页面显示，会使打包变慢
      async: false,
      tsconfig: resolveAppPath('tsconfig.json'),
      tslint: resolveAppPath('tslint.json'),
    }),
  ],
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
    plugins: [
      new TsconfigPathsPlugin({ configFile: resolveAppPath('tsconfig.json') }), // 实现alias
    ]
  }
}
