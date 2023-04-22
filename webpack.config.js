const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const { parse, resolve } = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { ProgressPlugin } = require("webpack");

const context = resolve(process.cwd(), "src/www");

const regExp = {
  images: /\.(a?png|gif|jpe?g|svg|webp)$/i,
  fonts: /\.(otf|ttf|woff2?)$/i,
  multimedia: /\.(mp3|webm|mp4)$/i,
};

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = !isDevelopment;

module.exports = {
  mode: isDevelopment ? "development" : "production",
  context,
  devtool: isDevelopment ? "eval" : false,
  watch: isDevelopment,
  watchOptions: {
    aggregateTimeout: 500,
  },
  entry: {
    app: ["./css/app.css"],
    overlay: ["./ts/overlay.ts"],
    "chat-overlay": ["./ts/chat-overlay.ts", "./css/chat-overlay.css"],
  },
  output: {
    path: resolve(process.cwd(), "dist/www"),
    filename: "assets/js/[name].js",
    publicPath: "/",
    assetModuleFilename: (pathData) => {
      const { filename } = pathData;

      if (!filename) {
        return "[name][ext]";
      }

      const { ext } = parse(filename);

      let contentType;

      for (const type of Object.keys(regExp)) {
        if (regExp[type].test(filename)) {
          contentType = type;
        }
      }

      if (!contentType) {
        contentType = "miscellaneous";

        console.log(`Unknown extension ${ext}, falling back to ${contentType}`);
      }

      return `assets/${contentType}/[name][ext]`;
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: true,
            },
          },
        ],
      },
      {
        test: regExp.images,
        type: "asset/resource",
      },
      {
        test: regExp.multimedia,
        type: "asset/resource",
      },
      {
        test: regExp.fonts,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".ts"],
  },
  plugins: [
    new ProgressPlugin(),
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: "*.html",
          to: ".",
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "assets/css/[name].css",
      chunkFilename: "assets/css/[id].css",
    }),
  ],
  optimization: {
    minimize: isProduction,
    minimizer: ["...", new CssMinimizerPlugin()],
    splitChunks: {
      minSize: 10e3,
      maxSize: 250e3,
    },
  },
};
