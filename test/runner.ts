import * as webpack from "webpack";
import MemoryFileSystem = require("memory-fs");

const loaderPath = require.resolve("../lib/loader");

export function compile(options: Partial<webpack.Configuration>) {
  return new Promise((resolve, reject) => {
    const compiler = webpack({
      ...options,
      module: {
        rules: [
          {
            test: /\.(graphql)$/,
            exclude: /node_modules/,
            use: [{ loader: loaderPath }],
          },
        ],
      },
      output: {
        path: "/",
        filename: `bundle.js`,
        libraryTarget: "commonjs2",
      },
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        const output = compiler.outputFileSystem
          .readFileSync("/bundle.js")
          .toString();

        resolve(eval(output));
      }
    });
  });
}
