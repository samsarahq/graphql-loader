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
exports.__esModule = true;
exports.removeUnusedFragments = exports.removeSourceLocations = exports.removeDuplicateFragments = void 0;
function removeDuplicateFragments(document) {
    var usedName = new Set();
    var dedupedDefs = document.definitions.filter(function (def) {
        if (def.kind !== "FragmentDefinition") {
            return true;
        }
        var name = def.name.value;
        if (usedName.has(name)) {
            return false;
        }
        else {
            usedName.add(name);
            return true;
        }
    });
    return __assign(__assign({}, document), { definitions: dedupedDefs });
}
exports.removeDuplicateFragments = removeDuplicateFragments;
function removeSourceLocations(document) {
    var updatedDoc = __assign({}, document);
    removeFieldDeep(updatedDoc, "loc");
    return updatedDoc;
}
exports.removeSourceLocations = removeSourceLocations;
function removeFieldDeep(obj, name) {
    for (var field in obj) {
        if (field === name)
            delete obj[field];
        else if (typeof obj[field] === "object")
            removeFieldDeep(obj[field], name);
    }
}
function removeUnusedFragments(document) {
    var usedFragments = new Set();
    function findFragmentSpreads(doc) {
        function traverse(selectionSet) {
            selectionSet.selections.forEach(function (selection) {
                if (selection.kind === "FragmentSpread") {
                    usedFragments.add(selection.name.value);
                }
                else if (selection.selectionSet) {
                    traverse(selection.selectionSet);
                }
            });
        }
        doc.definitions.forEach(function (def) {
            if (def.kind === "OperationDefinition" ||
                def.kind === "FragmentDefinition") {
                traverse(def.selectionSet);
            }
        });
    }
    findFragmentSpreads(document);
    var defCount = document.definitions.length;
    var cleanedDefs = document.definitions.filter(function (def) {
        return def.kind !== "FragmentDefinition" || usedFragments.has(def.name.value);
    });
    var updatedDoc = __assign(__assign({}, document), { definitions: cleanedDefs });
    if (defCount !== cleanedDefs.length) {
        // Some references may have been from fragments that were just recently unused.
        // If we removed any fragments, run the function again until we are no longer
        // removing any fragments.
        return removeUnusedFragments(updatedDoc);
    }
    return updatedDoc;
}
exports.removeUnusedFragments = removeUnusedFragments;
//# sourceMappingURL=transforms.js.map