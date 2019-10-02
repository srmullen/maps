const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: "eval-source-map",
  mode: 'development',
  entry: {
    main: "./src/main.js"
  },
  output: {
    path: "/",
    filename: "[name].js"
  },
  plugins: [
    new HtmlWebpackPlugin({
      // filename:,
      template: './index.html',
      chunks: ["main"]
    })
  ],
  resolve: {
    alias: {
      common: path.resolve(__dirname, 'src/common'),
      images: path.resolve(__dirname, 'src/images')
    }
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3500',
        pathRewrite: { '^/api': '' }
      }
    }
  }
};
