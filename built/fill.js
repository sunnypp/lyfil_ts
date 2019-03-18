var ConstraintTypes;
(function (ConstraintTypes) {
    ConstraintTypes[ConstraintTypes["Simple"] = 0] = "Simple";
    ConstraintTypes[ConstraintTypes["Or"] = 1] = "Or";
    ConstraintTypes[ConstraintTypes["And"] = 2] = "And";
})(ConstraintTypes || (ConstraintTypes = {}));
// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const idx = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
function foundInResultCache(source, constraint, environment) {
    // conceptually environment.resultCache[constraint][source];
    return idx(['resultCache', constraint, source], environment) ? true : false;
}
function cached(source, constraint, environment) {
    return environment.resultCache[constraint][source];
}
function evaluateWith(environment) {
    // will be evaluated according to current environment status in the future
    return result => (typeof result.loss === 'number' ? result : {
        loss: result.loss(environment),
        result: result.result
    });
}
function optimized(results) {
    return results.reduce((p, c) => (c.loss < p.loss ? c : p), results[0]);
}
function fill(source, constraint, environment) {
    if (foundInResultCache(source, constraint, environment)) {
        let cachedResults = cached(source, constraint, environment);
        return (environment.pick || optimized)(cachedResults.map(evaluateWith(environment)));
    }
    return {
        loss: source.length,
        result: []
    };
}
module.exports = fill;
