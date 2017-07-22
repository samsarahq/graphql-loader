import { runFixture, WebpackError } from "./runner";

describe("graphql-loader", function() {
  Object.entries({
    "should load a simple query": "simple",
    "should load an imported fragment": "fragments",
    "should ignore duplicate an imported fragment":
      "fragments-common-duplicates",
    "validates graphql query": "validator",
    "fails to parse invalid document": "fail-invalid-document",
    "fails to validate invalid field": "fail-invalid-field",
    "fails to validate missing fragment": "fail-missing-fragment",
  }).forEach(([name, fixturePath]) =>
    it(name, async function() {
      try {
        const document = await runFixture(fixturePath);
        expect(document).toMatchSnapshot();
      } catch (err) {
        if (err instanceof WebpackError) {
          expect(err).toMatchSnapshot();
        } else {
          throw err;
        }
      }
    }),
  );
});
