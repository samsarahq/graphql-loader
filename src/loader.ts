import { print as graphqlPrint } from "graphql/language/printer";
import { parse as graphqlParse } from "graphql/language/parser";
import { validate as graphqlValidate } from "graphql/validation/validate";
import { resolve, join, dirname } from "path";
import { Stats, writeFile } from "fs";
import {
  removeDuplicateFragments,
  removeSourceLocations,
  removeUnusedFragments,
} from "./transforms";

import { loader } from "webpack";
import {
  DocumentNode,
  DefinitionNode,
  GraphQLSchema,
  IntrospectionQuery,
  buildClientSchema,
  graphql,
  Source,
  OperationDefinitionNode,
} from "graphql";
import pify = require("pify");
import * as loaderUtils from "loader-utils";
import codegen from "./codegen";

interface CachedSchema {
  mtime: number;
  schema: GraphQLSchema;
}

let cachedSchemas: Record<string, CachedSchema> = {};

type OutputTarget = "string" | "document";
interface LoaderOptions {
  schema?: string;
  validate?: boolean;
  output?: OutputTarget;
  removeUnusedFragments?: boolean;
  minify?: boolean;
  emitDefaultExport?: boolean;
  codegen?: {
    typescript: ApolloCodegenTypescriptOptions;
  };
}

interface ApolloCodegenTypescriptOptions {
  passthroughCustomScalars: boolean;
  customScalarsPrefix: string;
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

async function stat(
  loader: loader.LoaderContext,
  filePath: string,
): Promise<Stats> {
  const fsStat: (path: string) => Promise<Stats> = pify(
    loader.fs.stat.bind(loader.fs),
  );
  return fsStat(filePath);
}

async function extractImports(
  loader: loader.LoaderContext,
  resolveContext: string,
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
        loader.resolve(resolveContext, filePath, (err, result) => {
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
  const contents = await Promise.all(
    files.map(async filePath => [
      dirname(filePath),
      await readFile(loader, filePath),
    ]),
  );

  const nodes = await Promise.all(
    contents.map(([fileContext, content]) =>
      loadSource(loader, fileContext, content),
    ),
  );
  const fragmentDefinitions = nodes.reduce((defs, node) => {
    defs.push(...node.definitions);
    return defs;
  }, [] as DefinitionNode[]);

  document.definitions = [...document.definitions, ...fragmentDefinitions];
  return document;
}

async function loadSource(
  loader: loader.LoaderContext,
  resolveContext: string,
  source: string,
) {
  let document: DocumentNode = graphqlParse(new Source(source, "GraphQL/file"));
  document = await extractImports(loader, resolveContext, source, document);
  return document;
}

async function loadSchema(
  loader: loader.LoaderContext,
  options: LoaderOptions,
): Promise<GraphQLSchema> {
  let schema = null;

  if (options.schema) {
    const loaderResolve = pify(loader.resolve);
    const schemaPath = await findFileInTree(
      loader,
      loader.context,
      options.schema,
    );
    loader.addDependency(schemaPath);

    const stats = await stat(loader, schemaPath);
    const lastChangedAt = stats.mtime.getTime();

    // Note that we always read the file before we check the cache. This is to put a
    // run-to-completion "mutex" around accesses to cachedSchemas so that updating the cache is not
    // deferred for concurrent loads. This should be reasonably inexpensive because the fs
    // read is already cached by memory-fs.
    const schemaString = await readFile(loader, schemaPath);

    // The cached version of the schema is valid as long its modification time has not changed.
    if (
      cachedSchemas[schemaPath] &&
      lastChangedAt <= cachedSchemas[schemaPath].mtime
    ) {
      return cachedSchemas[schemaPath].schema;
    }

    schema = buildClientSchema(JSON.parse(schemaString) as IntrospectionQuery);
    cachedSchemas[schemaPath] = {
      schema,
      mtime: lastChangedAt,
    };
  }

  if (!schema) {
    throw new Error("schema option must be passed if validate is true");
  }

  return schema;
}

async function loadOptions(loader: loader.LoaderContext) {
  const options: LoaderOptions = { ...loaderUtils.getOptions(loader) };
  let schema: GraphQLSchema | undefined = undefined;
  if (options.validate) {
    schema = await loadSchema(loader, options);
  }

  return {
    schema,
    output:
      !options.output || options.output === "string"
        ? "string"
        : "document" as OutputTarget,
    removeUnusedFragments: options.removeUnusedFragments,
    minify: options.minify,
    codegen: options.codegen,
    emitDefaultExport: options.emitDefaultExport,
  };
}

/**
 * findFileInTree returns the path for the requested file given the current context,
 * walking up towards the root until it finds the file. If the function fails to find
 * the file, it will throw an error.
 */
async function findFileInTree(
  loader: loader.LoaderContext,
  context: string,
  schemaPath: string,
) {
  let currentContext = context;
  while (true) {
    const fileName = join(currentContext, schemaPath);
    try {
      if ((await stat(loader, fileName)).isFile()) {
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
    const options = await loadOptions(this);
    const document = await loadSource(this, this.context, source);

    let codegenOutput = null;
    if (options.codegen && options.codegen.typescript) {
      if (!options.schema) {
        throw new Error("schema option must be passed if codegen is specified");
      }

      codegenOutput = codegen(options.schema, document);
    }

    removeDuplicateFragments(document);
    removeSourceLocations(document);

    if (options.removeUnusedFragments) {
      removeUnusedFragments(document);
    }

    if (options.schema) {
      // Validate
      validationErrors = graphqlValidate(options.schema, document);
      if (validationErrors.length > 0) {
        validationErrors.forEach(err => this.emitError(err as any));
      }
    }

    const content = JSON.stringify(
      options.output === "document" ? document : graphqlPrint(document),
    );
    const output =
      options.output === "string" && options.minify
        ? minifyDocumentString(content)
        : content;

    const exp = options.emitDefaultExport ? "export default " : "module.exports = ";

    let outputSource = `${exp}${output}`;
    if (codegenOutput) {
      outputSource = `const documentOutput = ${output};\n${codegenOutput[0]}\n${exp}spec;`;
      const writeFileP = pify<string, string, void>(writeFile as any);
      await writeFileP(`${this.resourcePath}.d.ts`, codegenOutput[1]);
    }

    done(null, outputSource);
  } catch (err) {
    done(err);
  }
}

function minifyDocumentString(documentString: string) {
  return documentString
    .replace(/#.*/g, "") // remove comments
    .replace(/\\n/g, " ") // replace line breaks with space
    .replace(/\s\s+/g, " ") // replace consecutive whitespace with one space
    .replace(/\s*({|}|\(|\)|\.|:|,)\s*/g, "$1"); // remove whitespace before/after operators
}

export {
  removeDuplicateFragments,
  removeSourceLocations,
  removeUnusedFragments,
} from "./transforms";
