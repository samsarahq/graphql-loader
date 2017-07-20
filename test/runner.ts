import * as webpack from "webpack";
import * as MemoryFileSystem from "memory-fs";

const loaderPath = require.resolve("../lib/loader");

export function compile(options) {
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
