import { compileToLegacyIR } from "apollo-codegen/lib/compiler/legacyIR";
import { generateSource } from "apollo-codegen/lib/typescript";

import {
  DocumentNode,
  GraphQLSchema,
  IntrospectionQuery,
  OperationDefinitionNode,
} from "graphql";

/**
 * Generate typescript types for the schema and document specified.
 * @returns [string, string] Returns code generation for webpack
 * and for a declaration file. The former should be injected by the loader
 * during compilation and the latter can be emitted to a d.ts file
 * for IDE help.
 */
export default function codegen(
  schema: GraphQLSchema,
  document: DocumentNode,
): [string, string] {
  const context = compileToLegacyIR(schema, document);
  context.options = {
    passthroughCustomScalars: true,
    customScalarsPrefix: "gql_",
  };
  const types = generateSource(context);
  const operationDef = document.definitions.find(
    def => def.kind === "OperationDefinition",
  ) as OperationDefinitionNode | undefined;
  if (!operationDef) {
    return [types, types.replace(/;/g, "")];
  }

  const operationKind = operationDef.operation;
  if (!operationDef.name) {
    throw new Error("cannot generate types for operation without name");
  }

  const operationName = operationDef.name.value;
  const resultType = `${operationName}${operationKind
    .charAt(0)
    .toUpperCase()}${operationKind.substring(1)}`;

  let inputType = "never";
  if (
    operationDef.variableDefinitions &&
    operationDef.variableDefinitions.length > 0
  ) {
    inputType = `${resultType}Variables`;
  }

  const webpackOutput = `
const spec: Spec<${resultType}, ${inputType}> = {
  query: documentOutput,
};
`;

  const declarationOutput = `
declare const Dummy: Spec<${resultType}, ${inputType}>;
export default Dummy;
`;

  const specType = `
export interface Spec<Result extends object, Input extends object> {
  query: string;
  result?: Result;
  variables?: Input;
}
`;

  return [
    `${types}${specType}${webpackOutput}`,
    // Remove semicolons, since declaration files do not allow "statements" in
    // ambient declarations.
    `${types}${specType}${declarationOutput}`.replace(/;/g, ""),
  ];
}
