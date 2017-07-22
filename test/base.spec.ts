import { runFixture, WebpackError } from "./runner";

describe("graphql-loader", function() {
  it("should load a simple query", async function() {
    const document = await runFixture("simple");
    expect(document).toMatchSnapshot();
  });

  it("should load an imported fragment", async function() {
    const document = await runFixture("fragments");
    expect(document).toMatchSnapshot();
  });

  it("should ignore duplicate an imported fragment", async function() {
    const document = await runFixture("fragments-common-duplicates");
    expect(document).toMatchSnapshot();
  });

  it("validates graphql query", async function() {
    const document = await runFixture("validator");
    expect(document).toMatchSnapshot();
  });

  it("fails to parse invalid document", async function() {
    try {
      const document = await runFixture("fail-invalid-document");
    } catch (err) {
      expect(err).toMatchSnapshot();
    }
  });

  it("fails to validate invalid field", async function() {
    try {
      const document = await runFixture("fail-invalid-field");
    } catch (err) {
      expect(err).toMatchSnapshot();
    }
  });

  it("fails to validate missing fragment", async function() {
    try {
      const document = await runFixture("fail-missing-fragment");
    } catch (err) {
      expect(err).toMatchSnapshot();
    }
  });
});
