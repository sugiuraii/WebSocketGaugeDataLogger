const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const pjrootPath = __dirname;

module.exports = {
  entry: './src/index.tsx',
  cache: true,
  mode: 'development',
  devtool: 'source-map',
  //target: 'node',
  output: {
    path: path.join(pjrootPath, 'dist/public'),
    filename: 'charttest.js',
    publicPath: ''
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      { type: "javascript/auto", test: /\.appconfig.jsonc$/, use: "file-loader?name=config/[name].[ext]" },
      //{ test: /bootstrap.slate.min.css/, use: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },// for bootstrap
      //{ test: /\.css$/, exclude: /bootstrap.slate.min.css/, use: 'file-loader?name=[name].[ext]' },
      { test: /\.css$/, use: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },// for bootstrap
      { test: /\.svg$/, use: 'url-loader?mimetype=image/svg+xml' },
      { test: /\.woff$/, use: 'url-loader?mimetype=application/font-woff' },
      { test: /\.woff2$/, use: 'url-loader?mimetype=application/font-woff' },
      { test: /\.eot$/, use: 'url-loader?mimetype=application/font-woff' }
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
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './index.html',
    }),
  ],
};
