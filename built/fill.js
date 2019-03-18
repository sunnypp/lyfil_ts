var ConstraintTypes;
(function (ConstraintTypes) {
    ConstraintTypes[ConstraintTypes["Simple"] = 0] = "Simple";
    ConstraintTypes[ConstraintTypes["Or"] = 1] = "Or";
    ConstraintTypes[ConstraintTypes["And"] = 2] = "And";
})(ConstraintTypes || (ConstraintTypes = {}));
// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const idx = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
function isFoundInDictionary(source, constraint, environment) {
    // conceptually environment.resultCache[constraint][source];
    return idx(['dictionary', constraint, source], environment) ? true : false;
}
function isFoundInResultCache(source, constraint, environment) {
    // conceptually environment.resultCache[constraint][source];
    return idx(['resultCache', constraint, source], environment) ? true : false;
}
function evaluateWith(environment) {
    // will be evaluated according to current environment status in the future
    return result => {
        return (typeof result.loss === 'number' ? result : {
            loss: result.loss(environment),
            result: result.result
        });
    };
}
function optimized(results) {
    return results.reduce((p, c) => (c.loss < p.loss ? c : p), results[0]);
}
function fill(source, constraint, environment) {
    if (isFoundInResultCache(source, constraint, environment)) {
        let cachedResults = environment.resultCache[constraint][source];
        return [environment, (environment.pick || optimized)(cachedResults.map(evaluateWith(environment)))];
    }
    if (isFoundInDictionary(source, constraint, environment)) {
        let weightedResults = environment.dictionary[constraint][source];
        return [environment, (environment.pick || optimized)(weightedResults)];
    }
    return [environment, {
            loss: source.length,
            result: []
        }];
}
module.exports = fill;
