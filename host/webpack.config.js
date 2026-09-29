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
    uniqueName: "host",
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
      name: "host",
      remotes: {
        productRemote: "productRemote@http://localhost:3001/remoteEntry.js",
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
    port: 3000,
    historyApiFallback: true,
    client: {
      overlay: {
        runtimeErrors: false,
      },
    },
  },
};
