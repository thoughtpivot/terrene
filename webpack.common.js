const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: "./src/index.ts",
  target: "web",
  output: {
    filename: '[name].js',
    sourceMapFilename: "[file].map",
    path: path.resolve(__dirname, "dist"),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|mp3)$/i,
        type: "asset/resource",
      },
      {
        test: /\.css$/,
        type: "javascript/auto",
        use: [path.resolve(__dirname, "src/components/scenes/HeavenOrHell/cssInjectLoader.js")],
      },
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        exclude: [path.resolve(__dirname, "node_modules/excalibur")],
        enforce: "pre",
      },
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          configFile: path.resolve(__dirname, "tsconfig.webpack.json"),
        },
        exclude: /node_modules/,
      },
      {
        test: /\.json$/,
        use: 'file-loader',
        type: 'javascript/auto'
      },
      {
        test: [/\.tm(x|j)$/, /\.ts(x|j)$/],
        use: 'raw-loader'
     }
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebPackPlugin({
      title: "Terrene - World 1-1",
      template: "./src/index.html",
    }),
    new CopyPlugin({
      patterns: [{
        from: "src/**/*",
        globOptions: {
          ignore: ["**/*.html", "**/*.ts", "**/*.js"]
        }
      }]
    }),
    new webpack.DefinePlugin({
      'process.env.AWS_REGION': JSON.stringify(process.env.AWS_REGION || 'us-east-1'),
      'process.env.AWS_ACCESS_KEY_ID': JSON.stringify(process.env.AWS_ACCESS_KEY_ID),
      'process.env.AWS_SECRET_ACCESS_KEY': JSON.stringify(process.env.AWS_SECRET_ACCESS_KEY),
    }),
  ],
};
