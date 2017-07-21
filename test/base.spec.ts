import { runFixture, WebpackError } from "./runner";
import * as snapshot from "snap-shot";

describe("graphql-loader", function() {
  it("should load a simple query", async function() {
    const document = await runFixture("simple");
    snapshot(document);
  });

  it("should load an imported fragment", async function() {
    const document = await runFixture("fragments");
    snapshot(document);
  });

  it("should ignore duplicate an imported fragment", async function() {
    const document = await runFixture("fragments-common-duplicates");
    snapshot(document);
  });

  it("validates graphql query", async function() {
    const document = await runFixture("validator");
    snapshot(document);
  });
});
