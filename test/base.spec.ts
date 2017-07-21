import { compile } from "./runner";

describe("loader", function() {
  it("should load a simple query", async function() {
    await compile({
      context: __dirname + "/fixtures/simple",
      entry: "./query.graphql",
    });
  });

  it("should load an imported fragment", async function() {
    await compile({
      context: __dirname + "/fixtures/fragments",
      entry: "./query.graphql",
    });
  });
});
