import {
  DocumentNode,
  SelectionSetNode,
  DefinitionNode,
} from "graphql/language/ast";

export function removeDuplicateFragments(document: DocumentNode) {
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

export function removeSourceLocations(document: DefinitionNode | DocumentNode) {
  if (document.loc) {
    delete document.loc;
  }

  for (const key of Object.keys(document)) {
    const value = (document as any)[key];
    if (Array.isArray(value)) {
      value.forEach(val => removeSourceLocations(val));
    } else if (value && typeof value === "object") {
      removeSourceLocations(value as DefinitionNode);
    }
  }
}

export function removeUnusedFragments(document: DocumentNode) {
  const usedFragments = new Set();
  function findFragmentSpreads(doc: DocumentNode) {
    function traverse(selectionSet: SelectionSetNode) {
      selectionSet.selections.forEach(selection => {
        if (selection.kind === "FragmentSpread") {
          usedFragments.add(selection.name.value);
        } else if (selection.selectionSet) {
          traverse(selection.selectionSet);
        }
      });
    }
    doc.definitions.forEach(def => {
      if (
        def.kind === "OperationDefinition" ||
        def.kind === "FragmentDefinition"
      ) {
        traverse(def.selectionSet);
      }
    });
  }
  findFragmentSpreads(document);

  const defCount = document.definitions.length;
  document.definitions = document.definitions.filter(
    def =>
      def.kind !== "FragmentDefinition" || usedFragments.has(def.name.value),
  );

  if (defCount !== document.definitions.length) {
    // Some references may have been from fragments that were just recently unused.
    // If we removed any fragments, run the function again until we are no longer
    // removing any fragments.
    removeUnusedFragments(document);
  }
}
