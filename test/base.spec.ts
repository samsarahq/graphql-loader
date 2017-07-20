import { compile } from "./runner";

describe("loader", function() {
  it("should load", async function() {
    console.log(
      await compile({
        context: __dirname + "/fixtures/simple",
        entry: "./query.graphql",
      }),
    );
  });
});
