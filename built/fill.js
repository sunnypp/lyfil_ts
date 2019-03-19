var ConstraintTypes;
(function (ConstraintTypes) {
    ConstraintTypes[ConstraintTypes["Simple"] = 0] = "Simple";
    ConstraintTypes[ConstraintTypes["Or"] = 1] = "Or";
    ConstraintTypes[ConstraintTypes["And"] = 2] = "And";
})(ConstraintTypes || (ConstraintTypes = {}));
// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const idx = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
const deep_set = (p, o, v) => {
    for (let i = 0; i < p.length - 1; i++) {
        o[p[i]] = o[p[i]] ? o[p[i]] : {};
        o = o[p[i]];
    }
    o[p[p.length - 1]] = v;
};
function isFoundInDictionary(source, constraint, environment) {
    // conceptually environment.resultCache[constraint][source];
    return idx(['dictionary', constraint, source], environment) ? true : false;
}
function isFoundInResultCache(source, constraint, environment) {
    // conceptually environment.resultCache[constraint][source];
    return idx(['resultCache', constraint, source], environment) ? true : false;
}
function evaluateWith(environment) {
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
function parse(constraint, environment) {
    return {
        type: ConstraintTypes.Simple,
        constraint: constraint
    };
}
function fill(source, constraint, environment) {
    if (isFoundInResultCache(source, constraint, environment)) {
        let cachedResults = environment.resultCache[constraint][source];
        return [environment, (environment.pick || optimized)(cachedResults.map(evaluateWith(environment)))];
    }
    if (isFoundInDictionary(source, constraint, environment)) {
        let weightedResults = environment.dictionary[constraint][source];
        deep_set(['resultCache', constraint, source], environment, weightedResults);
        return [environment, (environment.pick || optimized)(weightedResults)];
    }
    const parsedConstraint = parse(constraint, environment);
    switch (parsedConstraint.type) {
        case ConstraintTypes.Simple:
            let currentResult = {
                loss: source.length,
                result: Array(source.length).fill('')
            };
            // Instead of skipping, save all results with loss upper bounded
            for (let i = 1; currentResult.loss > 0 && i < source.length; i++) {
                let [_1, head] = fill(source.substr(0, i), constraint, environment);
                // should use _1 instead of environment in case of non loopable?
                let [_2, tail] = fill(source.substr(i), constraint, environment);
                let tempResult = (environment.accumulate || ((h, t) => ({
                    loss: h.loss + t.loss,
                    result: h.result.concat(t.result)
                })))(head, tail);
                if (currentResult.loss > tempResult.loss) {
                    currentResult = tempResult;
                }
            }
            deep_set(['resultCache', constraint, source], environment, [currentResult]);
            return [environment, currentResult];
    }
}
module.exports = fill;
