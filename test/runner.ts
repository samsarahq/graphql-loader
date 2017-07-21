import * as webpack from "webpack";
import MemoryFileSystem = require("memory-fs");
import { DocumentNode } from "graphql";

const loaderPath = require.resolve("../lib/loader");

export class WebpackError extends Error {
  constructor(public errors: Error[]) {
    super(`Test Run Compiler Error:\n${errors.map(err => err).join("\n")}`);

    Object.setPrototypeOf(this, WebpackError.prototype);
  }
}

export function compile(
  options: Partial<webpack.Configuration>,
): Promise<DocumentNode> {
  return new Promise((resolve, reject) => {
    const fs = new MemoryFileSystem();

    const compiler = webpack({
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
      ...options,
    });

    compiler.outputFileSystem = fs;

    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        if (stats.hasErrors()) {
          reject(new WebpackError(stats.toJson().errors));
        }

        const output = fs.readFileSync("/bundle.js").toString() as string;
        resolve(eval(output) as DocumentNode);
      }
    });
  });
}
