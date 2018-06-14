import * as webpack from "webpack";
import * as path from "path";
import MemoryFileSystem = require("memory-fs");
import { DocumentNode } from "graphql";

const loaderPath = require.resolve("../src/loader");

export class TestRunError extends Error {
  constructor(public errors: String[]) {
    super(`Test Run Compiler Error:\n${errors.map(err => err).join("\n")}`);

    Object.setPrototypeOf(this, TestRunError.prototype);
  }
}

export function runFixture(fixtureName: string): Promise<{}> {
  const config = require(path.join(
    __dirname,
    "/fixtures/",
    fixtureName,
    "webpack.config.ts",
  ));

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
      ...config,
    });

    compiler.outputFileSystem = fs;

    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        if (stats.hasErrors()) {
          reject(new TestRunError(stats.toJson().errors));
          return;
        }

        const output = fs.readFileSync("/bundle.js").toString() as string;
        resolve(eval(output));
      }
    });
  });
}
