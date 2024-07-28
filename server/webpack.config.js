const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const pjrootPath = path.resolve(__dirname);
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/WebSocketDataLoggerServer.ts',
  cache: true,
  mode: 'development',
  devtool: 'source-map',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'WebSocketDataLoggerServer.js',
    publicPath: ''
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      { type: "javascript/auto", test: /\.appconfig.jsonc$/, use: "file-loader?name=config/[name].[ext]" }
    ],
  },
  resolve: {
    // Maybe not necessary. webpack error is avoided by adding target:'node'.
    /* 
    fallback : {
      url: false,
      crypto: false,
      http: false,
      https: false,
      stream: false,
      zlib: false,
      os: false,
      path: false,
      fs: false,
      tls: false,
      net: false
    },*/
    extensions: [
      '.ts',
      '.tsx',
      '.js'
    ],
    plugins: [new TsconfigPathsPlugin({configFile: path.resolve(pjrootPath, "tsconfig.json")})]
  },
  externals: [nodeExternals()]
};
