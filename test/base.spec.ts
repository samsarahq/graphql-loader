import { compile, WebpackError } from "./runner";
import * as snapshot from "snap-shot";
const loaderPath = require.resolve("../lib/loader");

describe("loader", function() {
  it("should load a simple query", async function() {
    const document = await compile({
      context: __dirname + "/fixtures/simple",
      entry: "./query.graphql",
    });
    snapshot(document);
  });

  it("should load an imported fragment", async function() {
    const document = await compile({
      context: __dirname + "/fixtures/fragments",
      entry: "./query.graphql",
    });
    snapshot(document);
  });

  it("should ignore duplicate an imported fragment", async function() {
    const document = await compile({
      context: __dirname + "/fixtures/fragments-common-duplicates",
      entry: "./query.graphql",
    });
    snapshot(document);
  });

  it("validates graphql query", async function() {
    const document = await compile({
      context: __dirname + "/fixtures/validator",
      entry: "./query.graphql",
      module: {
        rules: [
          {
            test: /\.(graphql)$/,
            exclude: /node_modules/,
            use: [
              {
                loader: loaderPath,
                options: { validate: true, schema: "./schema.json" },
              },
            ],
          },
        ],
      },
    });
    snapshot(document);
  });
});
