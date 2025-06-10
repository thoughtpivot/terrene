const { merge } = require("webpack-merge");
const common = require("./webpack.common");
const path = require("path")
module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
    },
    compress: true,
    port: 9000,
    client: {
      logging: 'warn',
      overlay: false,
      progress: false,
    },
    hot: true,
    liveReload: true,
  }
});
