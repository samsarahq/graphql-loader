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

  it("fails to parse invalid document", async function() {
    try {
      const document = await runFixture("fail-invalid-document");
    } catch (err) {
      snapshot(err);
    }
  });

  it("fails to validate invalid field", async function() {
    try {
      const document = await runFixture("fail-invalid-field");
    } catch (err) {
      snapshot(err);
    }
  });

  it("fails to validate missing fragment", async function() {
    try {
      const document = await runFixture("fail-missing-fragment");
    } catch (err) {
      snapshot(err);
    }
  });
});
