// import * as CopyPlugin from "copy-webpack-plugin";
import * as CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as MiniCssExtractPlugin from "mini-css-extract-plugin";

import { Configuration, ProgressPlugin, webpack } from "webpack";
import { error, extendLogger, warning } from "./log";
import { isDevelopment, isProduction } from "./util";
import { parse, resolve } from "path";

import { CleanWebpackPlugin } from "clean-webpack-plugin";

const namespace = "Webpack";
const log = extendLogger(namespace);

const context = resolve(__dirname, "../../www");

const regExp: Record<string, RegExp> = {
  images: /\.(a?png|gif|jpe?g|svg|webp)$/i,
  fonts: /\.(otf|ttf|woff2?)$/i,
  multimedia: /\.(mp3|webm|mp4)$/i,
};

// TODO: declare types (d.ts) to import files from TypeScript code

const webpackConfig: Configuration = {
  mode: isDevelopment ? "development" : "production",
  context,
  devtool: isDevelopment ? "eval" : false,
  watch: isDevelopment,
  watchOptions: {
    aggregateTimeout: 500,
  },
  entry: {
    app: ["./ts/index.ts", "./css/app.css"],
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

        warning(
          "[%s] Unknown extension %s, falling back to %s",
          namespace,
          ext,
          contentType
        );
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
    new HtmlWebpackPlugin({
      template: "!!html-loader!src/www/index.html",
      inject: "body",
    }),
    // new CopyPlugin({
    //   patterns: [
    //     {
    //       from: "static",
    //       to: "assets",
    //     },
    //   ],
    // }),
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

function runWebpack(): Promise<void> {
  return new Promise((res, rej) => {
    log("Running");
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        error("[%s] %s", namespace, err);
        rej(err);
      } else if (stats?.hasErrors() || stats?.hasWarnings()) {
        error("[%s] %s", namespace, stats);
      } else {
        log("Compiled ok");
      }

      res();
    });
  });
}

export { runWebpack };
