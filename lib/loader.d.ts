import { loader } from "webpack";
export default function loader(this: loader.LoaderContext, source: string): Promise<void>;
export { removeDuplicateFragments, removeSourceLocations, removeUnusedFragments, } from "./transforms";
