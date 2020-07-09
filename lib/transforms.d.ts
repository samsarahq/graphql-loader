import { DocumentNode } from "graphql/language/ast";
export declare function removeDuplicateFragments(document: DocumentNode): DocumentNode;
export declare function removeSourceLocations(document: DocumentNode): DocumentNode;
export declare function removeUnusedFragments(document: DocumentNode): DocumentNode;
