const webpack = require("webpack");
const MemoryFileSystem = require("memory-fs");
const path = require("path");
const loaderPath = require.resolve("../lib/loader");

describe("loader", function() {
  it("should load", async function() {
    function compile() {
      return new Promise((resolve, reject) => {
        const compiler = webpack({
          context: __dirname + "/fixtures/simple",
          entry: "./query.graphql",
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

            resolve(eval(output), stats);
          }
        });
      });
    }

    console.log(await compile());
  });
});
