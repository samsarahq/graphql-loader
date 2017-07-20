const webpack = require("webpack");
const path = require("path");
const loaderPath = require.resolve("../lib/loader");

describe("loader", function() {
  it("should load", async function() {
    function compile() {
      return new Promise((resolve, reject) => {
        webpack(
          {
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
              path: path.join(__dirname, "output"),
              filename: `bundle.js`,
              libraryTarget: "commonjs2",
            },
          },
          (err, stats) => {
            if (err) {
              reject(err);
            } else {
              resolve(stats);
            }
          },
        );
      });
    }

    console.log(await compile());

    const x = require(`./output/bundle.js`);
  });
});
