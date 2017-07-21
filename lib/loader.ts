import gql from "graphql-tag";
import { loader } from "webpack";
import { DocumentNode, DefinitionNode } from "graphql";
import * as fs from "fs";
import pify = require("pify");

const fsReadFile = pify(fs.readFile);
async function readFile(filePath: string): Promise<string> {
  const content = await fsReadFile(filePath);
  return content.toString();
}

async function extractImports(
  loader: loader.LoaderContext,
  source: string,
  document: DocumentNode,
) {
  const lines = source.split(/(\r\n|\r|\n)/);

  const imports: Array<Promise<string>> = [];
  lines.forEach(line => {
    if (line[0] !== "#") {
      return;
    }

    const commentContent = line.slice(1).split(" ");
    if (commentContent[0] !== "import") {
      return;
    }

    const filePathMatch =
      commentContent[1] && commentContent[1].match(/^[\"\'](.+)[\"\']/);
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

  const importedDocumentFiles = await Promise.all(imports);
  const importedDocumentContents = await Promise.all(
    importedDocumentFiles.map(doc => readFile(doc)),
  );

  const importedDocumentNodes = await Promise.all(
    importedDocumentContents.map(content => {
      return loadSource(loader, content);
    }),
  );

  const flattenedDefinitions = importedDocumentNodes.reduce((defs, node) => {
    defs.push(...node.definitions);
    return defs;
  }, [] as DefinitionNode[]);

  document.definitions = [...document.definitions, ...flattenedDefinitions];
  return document;
}

async function loadSource(loader: loader.LoaderContext, source: string) {
  let document: DocumentNode = gql(source);
  document = await extractImports(loader, source, document);
  return document;
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

  try {
    done(
      null,
      "module.exports = " + JSON.stringify(await loadSource(this, source)),
    );
  } catch (err) {
    done(err);
  }
}
