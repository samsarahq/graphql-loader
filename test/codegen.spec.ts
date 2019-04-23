import { runFixture, TestRunError } from "./runner";
import { readFileSync } from "fs";

describe("codegen", function() {
  it("codegen", async function() {
    const document = await runFixture("codegen");
    expect(document).toMatchSnapshot();

    const declarationFile = await readFileSync(
      "./test/fixtures/codegen/query.graphql.d.ts",
      null,
    );
    expect(declarationFile.toString()).toMatchSnapshot();
  });

  it("codegen with default export", async function() {
    const document = await runFixture("codegen-export-default");
    expect(document).toMatchSnapshot();

    const declarationFile = await readFileSync(
      "./test/fixtures/codegen-export-default/query.graphql.d.ts",
      null,
    );
    expect(declarationFile.toString()).toMatchSnapshot();
  });
});
