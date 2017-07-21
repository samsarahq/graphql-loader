import { compile } from "./runner";
import * as snapshot from "snap-shot";

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
});
