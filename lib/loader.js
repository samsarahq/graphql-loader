"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.removeUnusedFragments = exports.removeSourceLocations = exports.removeDuplicateFragments = void 0;
var printer_1 = require("graphql/language/printer");
var parser_1 = require("graphql/language/parser");
var validate_1 = require("graphql/validation/validate");
var path_1 = require("path");
var transforms_1 = require("./transforms");
var graphql_1 = require("graphql");
var pify = require("pify");
var loaderUtils = require("loader-utils");
var cachedSchemas = {};
function readFile(loader, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var fsReadFile, content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fsReadFile = pify(loader.fs.readFile.bind(loader.fs));
                    return [4 /*yield*/, fsReadFile(filePath)];
                case 1:
                    content = _a.sent();
                    return [2 /*return*/, content.toString()];
            }
        });
    });
}
function stat(loader, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var fsStat;
        return __generator(this, function (_a) {
            fsStat = pify(loader.fs.stat.bind(loader.fs));
            return [2 /*return*/, fsStat(filePath)];
        });
    });
}
function extractImports(loader, resolveContext, source, document) {
    return __awaiter(this, void 0, void 0, function () {
        var lines, loaderResolve, imports, files, contents, nodes, fragmentDefinitions, updatedDocument;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lines = source.split(/(\r\n|\r|\n)/);
                    loaderResolve = pify(loader.resolve);
                    imports = [];
                    lines.forEach(function (line) {
                        // Find lines that match syntax with `#import "<file>"`
                        if (line[0] !== "#") {
                            return;
                        }
                        var comment = line.slice(1).split(" ");
                        if (comment[0] !== "import") {
                            return;
                        }
                        var filePathMatch = comment[1] && comment[1].match(/^[\"\'](.+)[\"\']/);
                        if (!filePathMatch || !filePathMatch.length) {
                            throw new Error("#import statement must specify a quoted file path");
                        }
                        var filePath = filePathMatch[1];
                        imports.push(new Promise(function (resolve, reject) {
                            loader.resolve(resolveContext, filePath, function (err, result) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    loader.addDependency(result);
                                    resolve(result);
                                }
                            });
                        }));
                    });
                    return [4 /*yield*/, Promise.all(imports)];
                case 1:
                    files = _a.sent();
                    return [4 /*yield*/, Promise.all(files.map(function (filePath) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = [path_1.dirname(filePath)];
                                        return [4 /*yield*/, readFile(loader, filePath)];
                                    case 1: return [2 /*return*/, _a.concat([
                                            _b.sent()
                                        ])];
                                }
                            });
                        }); }))];
                case 2:
                    contents = _a.sent();
                    return [4 /*yield*/, Promise.all(contents.map(function (_a) {
                            var fileContext = _a[0], content = _a[1];
                            return loadSource(loader, fileContext, content);
                        }))];
                case 3:
                    nodes = _a.sent();
                    fragmentDefinitions = nodes.reduce(function (defs, node) {
                        defs.push.apply(defs, node.definitions);
                        return defs;
                    }, []);
                    updatedDocument = __assign(__assign({}, document), { definitions: __spreadArrays(document.definitions, fragmentDefinitions) });
                    return [2 /*return*/, updatedDocument];
            }
        });
    });
}
function loadSource(loader, resolveContext, source) {
    return __awaiter(this, void 0, void 0, function () {
        var document;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    document = parser_1.parse(new graphql_1.Source(source, "GraphQL/file"));
                    return [4 /*yield*/, extractImports(loader, resolveContext, source, document)];
                case 1:
                    document = _a.sent();
                    return [2 /*return*/, document];
            }
        });
    });
}
function loadSchema(loader, options) {
    return __awaiter(this, void 0, void 0, function () {
        var schema, loaderResolve, schemaPath, stats, lastChangedAt, schemaString;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    schema = null;
                    if (!options.schema) return [3 /*break*/, 4];
                    loaderResolve = pify(loader.resolve);
                    return [4 /*yield*/, findFileInTree(loader, loader.context, options.schema)];
                case 1:
                    schemaPath = _a.sent();
                    loader.addDependency(schemaPath);
                    return [4 /*yield*/, stat(loader, schemaPath)];
                case 2:
                    stats = _a.sent();
                    lastChangedAt = stats.mtime.getTime();
                    return [4 /*yield*/, readFile(loader, schemaPath)];
                case 3:
                    schemaString = _a.sent();
                    // The cached version of the schema is valid as long its modification time has not changed.
                    if (cachedSchemas[schemaPath] &&
                        lastChangedAt <= cachedSchemas[schemaPath].mtime) {
                        return [2 /*return*/, cachedSchemas[schemaPath].schema];
                    }
                    schema = graphql_1.buildClientSchema(JSON.parse(schemaString));
                    cachedSchemas[schemaPath] = {
                        schema: schema,
                        mtime: lastChangedAt
                    };
                    _a.label = 4;
                case 4:
                    if (!schema) {
                        throw new Error("schema option must be passed if validate is true");
                    }
                    return [2 /*return*/, schema];
            }
        });
    });
}
function loadOptions(loader) {
    return __awaiter(this, void 0, void 0, function () {
        var options, schema;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = __assign({}, loaderUtils.getOptions(loader));
                    schema = undefined;
                    if (!options.validate) return [3 /*break*/, 2];
                    return [4 /*yield*/, loadSchema(loader, options)];
                case 1:
                    schema = _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, {
                        schema: schema,
                        output: !options.output || options.output === "string"
                            ? "string"
                            : "document",
                        removeUnusedFragments: options.removeUnusedFragments,
                        minify: options.minify,
                        emitDefaultExport: options.emitDefaultExport
                    }];
            }
        });
    });
}
/**
 * findFileInTree returns the path for the requested file given the current context,
 * walking up towards the root until it finds the file. If the function fails to find
 * the file, it will throw an error.
 */
function findFileInTree(loader, context, schemaPath) {
    return __awaiter(this, void 0, void 0, function () {
        var currentContext, fileName, err_1, parent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentContext = context;
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 6];
                    fileName = path_1.join(currentContext, schemaPath);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, stat(loader, fileName)];
                case 3:
                    if ((_a.sent()).isFile()) {
                        return [2 /*return*/, fileName];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    return [3 /*break*/, 5];
                case 5:
                    parent = path_1.dirname(currentContext);
                    if (parent === currentContext) {
                        // Reached root of the fs, but we still haven't found anything.
                        throw new Error("Could not find schema file '" + schemaPath + " from any parent of '" + context + "'");
                    }
                    currentContext = parent;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function loader(source) {
    return __awaiter(this, void 0, void 0, function () {
        var done, options, sourceDoc, dedupedFragDoc, cleanedSourceDoc, document, validationErrors, content, output, exp, outputSource, err_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    this.cacheable();
                    done = this.async();
                    if (!done) {
                        throw new Error("Loader does not support synchronous processing");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loadOptions(this)];
                case 2:
                    options = _a.sent();
                    return [4 /*yield*/, loadSource(this, this.context, source)];
                case 3:
                    sourceDoc = _a.sent();
                    dedupedFragDoc = transforms_1.removeDuplicateFragments(sourceDoc);
                    cleanedSourceDoc = transforms_1.removeSourceLocations(dedupedFragDoc);
                    document = options.removeUnusedFragments
                        ? transforms_1.removeUnusedFragments(cleanedSourceDoc)
                        : cleanedSourceDoc;
                    if (options.schema) {
                        validationErrors = validate_1.validate(options.schema, document);
                        if (validationErrors && validationErrors.length > 0) {
                            validationErrors.forEach(function (err) { return _this.emitError(err); });
                        }
                    }
                    content = JSON.stringify(options.output === "document" ? document : printer_1.print(document));
                    output = options.output === "string" && options.minify
                        ? minifyDocumentString(content)
                        : content;
                    exp = options.emitDefaultExport
                        ? "export default "
                        : "module.exports = ";
                    outputSource = "" + exp + output;
                    done(null, outputSource);
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _a.sent();
                    done(err_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = loader;
function minifyDocumentString(documentString) {
    return documentString
        .replace(/#.*/g, "") // remove comments
        .replace(/\\n/g, " ") // replace line breaks with space
        .replace(/\s\s+/g, " ") // replace consecutive whitespace with one space
        .replace(/\s*({|}|\(|\)|\.|:|,)\s*/g, "$1"); // remove whitespace before/after operators
}
var transforms_2 = require("./transforms");
__createBinding(exports, transforms_2, "removeDuplicateFragments");
__createBinding(exports, transforms_2, "removeSourceLocations");
__createBinding(exports, transforms_2, "removeUnusedFragments");
//# sourceMappingURL=loader.js.map