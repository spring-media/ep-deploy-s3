const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: {
    deploy: './src/deploy.js',
    environment: './src/environments.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'ep-deploy-s3',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  devtool: false,
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  },
  target: 'node',
  externals: [nodeExternals()]
}
