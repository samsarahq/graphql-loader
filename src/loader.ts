import gql from "graphql-tag";
import { print as graphqlPrint } from "graphql/language/printer";
import { parse as graphqlParse } from "graphql/language/parser";
import { validate as graphqlValidate } from "graphql/validation/validate";
import { resolve, join, dirname } from "path";
import { Stats } from "fs";

import { loader } from "webpack";
import {
  DocumentNode,
  DefinitionNode,
  GraphQLSchema,
  IntrospectionQuery,
  buildClientSchema,
  graphql,
} from "graphql";
import pify = require("pify");
import * as loaderUtils from "loader-utils";

type OutputTarget = "string" | "document";
interface LoaderOptions {
  schema?: string;
  validate?: boolean;
  output?: OutputTarget;
}

async function readFile(
  loader: loader.LoaderContext,
  filePath: string,
): Promise<string> {
  const fsReadFile: (path: string) => Promise<Buffer> = pify(
    loader.fs.readFile.bind(loader.fs),
  );
  const content = await fsReadFile(filePath);
  return content.toString();
}

async function extractImports(
  loader: loader.LoaderContext,
  source: string,
  document: DocumentNode,
) {
  const lines = source.split(/(\r\n|\r|\n)/);
  const loaderResolve = pify(loader.resolve);

  const imports: Array<Promise<string>> = [];
  lines.forEach(line => {
    // Find lines that match syntax with `#import "<file>"`
    if (line[0] !== "#") {
      return;
    }

    const comment = line.slice(1).split(" ");
    if (comment[0] !== "import") {
      return;
    }

    const filePathMatch = comment[1] && comment[1].match(/^[\"\'](.+)[\"\']/);
    if (!filePathMatch || !filePathMatch.length) {
      throw new Error("#import statement must specify a quoted file path");
    }

    const filePath = filePathMatch[1];
    imports.push(
      new Promise((resolve, reject) => {
        loader.resolve(loader.context, filePath, (err, result) => {
          if (err) {
            reject(err);
          } else {
            loader.addDependency(result);
            resolve(result);
          }
        });
      }),
    );
  });

  const files = await Promise.all(imports);
  const contents = await Promise.all(files.map(doc => readFile(loader, doc)));

  const nodes = await Promise.all(
    contents.map(content => loadSource(loader, content)),
  );

  const fragmentDefinitions = nodes.reduce((defs, node) => {
    defs.push(...node.definitions);
    return defs;
  }, [] as DefinitionNode[]);

  document.definitions = [...document.definitions, ...fragmentDefinitions];
  return document;
}

async function loadSource(loader: loader.LoaderContext, source: string) {
  let document: DocumentNode = gql(source);
  document = await extractImports(loader, source, document);
  return document;
}

function removeDuplicateFragments(document: DocumentNode) {
  const usedName = new Set();
  document.definitions = document.definitions.filter(def => {
    if (def.kind !== "FragmentDefinition") {
      return true;
    }

    const name = def.name.value;
    if (usedName.has(name)) {
      return false;
    } else {
      usedName.add(name);
      return true;
    }
  });
}

async function loadOptions(loader: loader.LoaderContext) {
  const options: LoaderOptions = { ...loaderUtils.getOptions(loader) };
  let schema: GraphQLSchema | undefined = undefined;
  if (options.validate) {
    // XXX: add a test
    if (!options.schema) {
      throw new Error("schema option must be passed if validate is true");
    }

    const loaderResolve = pify(loader.resolve);
    const schemaPath = await findSchemaFile(
      loader,
      loader.context,
      options.schema,
    );
    loader.addDependency(schemaPath);
    const schemaString = await readFile(loader, schemaPath);
    schema = buildClientSchema(JSON.parse(schemaString) as IntrospectionQuery);
  }

  return {
    schema,
    output:
      !options.output || options.output === "document"
        ? "document"
        : "string" as OutputTarget,
  };
}

async function findSchemaFile(
  loader: loader.LoaderContext,
  context: string,
  schemaPath: string,
) {
  const fsStat: (path: string) => Promise<Stats> = pify(
    loader.fs.stat.bind(loader.fs),
  );
  let currentContext = context;
  while (true) {
    const fileName = join(currentContext, schemaPath);
    try {
      if ((await fsStat(fileName)).isFile()) {
        return fileName;
      }
    } catch (err) {}
    const parent = dirname(currentContext);
    if (parent === currentContext) {
      // Reached root of the fs, but we still haven't found anything.
      throw new Error(
        `Could not find schema file '${schemaPath} from any parent of '${context}'`,
      );
    }
    currentContext = parent;
  }
}

export default async function loader(
  this: loader.LoaderContext,
  source: string,
) {
  this.cacheable();
  const done = this.async();
  if (!done) {
    throw new Error("Loader does not support synchronous processing");
  }

  let validationErrors: Error[] = [];
  try {
    const { schema, output: outputTarget } = await loadOptions(this);

    const document = await loadSource(this, source);
    removeDuplicateFragments(document);

    if (schema) {
      // Validate
      validationErrors = graphqlValidate(schema, document);
      if (validationErrors.length > 0) {
        validationErrors.forEach(err => this.emitError(err as any));
      }
    }

    const output = JSON.stringify(
      outputTarget === "document" ? document : graphqlPrint(document),
    );

    done(null, `module.exports = ${output}`);
  } catch (err) {
    done(err);
  }
}
