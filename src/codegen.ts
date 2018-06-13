import { compileToLegacyIR } from "apollo-codegen/lib/compiler/legacyIR";
import { generateSource } from "apollo-codegen/lib/typescript";

import {
  DocumentNode,
  GraphQLSchema,
  IntrospectionQuery,
  OperationDefinitionNode,
} from "graphql";

export default function codegen(
  schema: GraphQLSchema,
  document: DocumentNode,
): string {
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
    return types;
  }

  const operationKind = operationDef.operation;
  if (!operationDef.name) {
    throw new Error("cannot generate types for operation without name");
  }

  const operationName = operationDef.name.value;
  const resultType = `${operationName}${operationKind
    .charAt(0)
    .toUpperCase()}${operationKind.substring(1)}`;

  let inputType = "{}";
  if (operationDef.variableDefinitions) {
    inputType = `${resultType}Variables`;
  }
  const operationSpec = `
export interface Spec<Result extends object, Input extends object> {
  query: string;
  result?: Result;
  variables?: Input;
}

const spec: Spec<${resultType}, ${inputType}> = {
  query: documentOutput,
};
`;
  return `${types}${operationSpec}`;
}
