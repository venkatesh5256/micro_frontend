const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin =
  require("webpack").container.ModuleFederationPlugin;
const path = require("path");
const packageJson = require("./package.json");

const reactVersion = packageJson.dependencies.react;
const reactDomVersion = packageJson.dependencies["react-dom"];

module.exports = {
  entry: "./src/main.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    publicPath: "auto",
    uniqueName: "productRemote",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "productRemote",
      filename: "remoteEntry.js",
      exposes: {
        "./ProductList": "./src/components/ProductList",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: reactVersion,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: reactDomVersion,
        },
        "react-dom/client": {
          singleton: true,
          requiredVersion: reactDomVersion,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
    }),
  ],
  devServer: {
    port: 3001,
    historyApiFallback: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
};
