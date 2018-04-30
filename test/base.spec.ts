import { runFixture, TestRunError } from "./runner";

describe("graphql-loader", function() {
  [
    "simple",
    "fragments",
    "fragments-common-duplicates",
    "validator",
    "fail-invalid-document",
    "fail-invalid-field",
    "fail-invalid-schema-path",
    "fail-missing-fragment",
    "fail-missing-schema-path",
    "document-output",
    "filter-unused-fragments",
    "issue-1-import-from-fragment",
    "two-loaders",
  ].forEach(fixturePath =>
    it(fixturePath, async function() {
      try {
        const document = await runFixture(fixturePath);
        expect(document).toMatchSnapshot();
      } catch (err) {
        if (err instanceof TestRunError) {
          expect(
            err.errors.map(err =>
              // Attempt to filter out file paths and stack trace lines.
              err
                .split("\n")
                .filter(line => !line.match(/^\s+at/))
                .map(line =>
                  line.replace(/(\/[A-Za-z0-9-_\.]+)+(:[0-9]+:[0-9]+)?/g, ""),
                )
                .join("\n"),
            ),
          ).toMatchSnapshot();
        } else {
          throw err;
        }
      }
    }),
  );
});
