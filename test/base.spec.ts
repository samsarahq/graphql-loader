import { runFixture, TestRunError } from "./runner";

describe("graphql-loader", function() {
  [
    "simple",
    "fragments",
    "fragments-common-duplicates",
    "validator",
    "fail-invalid-document",
    "fail-invalid-field",
    "fail-missing-fragment",
  ].forEach(fixturePath =>
    it(fixturePath, async function() {
      try {
        const document = await runFixture(fixturePath);
        expect(document).toMatchSnapshot();
      } catch (err) {
        if (err instanceof TestRunError) {
          expect(
            err.errors.map(err =>
              err.split("\n").filter(line => !line.match(/^\s+at/)).join("\n"),
            ),
          ).toMatchSnapshot();
        } else {
          throw err;
        }
      }
    }),
  );
});
