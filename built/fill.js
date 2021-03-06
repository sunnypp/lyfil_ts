"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LOOPABLE = Symbol.for('LOOPABLE');
const EMPTY_MARKER = '';
const CONSTRAINT_SYMBOL = {
    OR: '|',
    AND: '-',
};
const utils_1 = require("./utils");
var ConstraintTypes;
(function (ConstraintTypes) {
    ConstraintTypes[ConstraintTypes["Simple"] = 0] = "Simple";
    ConstraintTypes[ConstraintTypes["Or"] = 1] = "Or";
    ConstraintTypes[ConstraintTypes["And"] = 2] = "And";
})(ConstraintTypes || (ConstraintTypes = {}));
const deep_set = (p, o, v) => {
    for (let i = 0; i < p.length - 1; i++) {
        o[p[i]] = o[p[i]] ? o[p[i]] : {};
        o = o[p[i]];
    }
    o[p[p.length - 1]] = v;
};
function isFoundInDictionary(source, constraint, environment) {
    return utils_1.default(['dictionary', constraint, source], environment) ? true : false;
}
function isFoundInResultCache(source, constraint, environment) {
    return utils_1.default(['resultCache', constraint, source], environment) ? true : false;
}
function isLoopable(constraint, environment) {
    return utils_1.default(['dictionary', constraint, LOOPABLE], environment) ? true : false;
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
    const orIndex = constraint.indexOf(CONSTRAINT_SYMBOL.OR);
    if (orIndex !== -1) {
        return {
            type: ConstraintTypes.Or,
            constraint: [constraint.substr(0, orIndex), constraint.substr(orIndex + 1)]
        };
    }
    const andIndex = constraint.indexOf(CONSTRAINT_SYMBOL.AND);
    if (andIndex !== -1) {
        return {
            type: ConstraintTypes.And,
            constraint: [constraint.substr(0, andIndex), constraint.substr(andIndex + 1)]
        };
    }
    return {
        type: ConstraintTypes.Simple,
        constraint: constraint
    };
}
function isAlias(constraint, environment) {
    return constraint[0] === ":" && utils_1.default(['alias', constraint.substr(1)], environment);
}
function lossArray(length) {
    return Array(length).fill(EMPTY_MARKER);
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
    let currentResult = {
        loss: source.length,
        result: lossArray(source.length)
    };
    switch (parsedConstraint.type) {
        case ConstraintTypes.Or:
            let [case1, case2] = parsedConstraint.constraint;
            currentResult = optimized([
                fill(source, case1, environment)[1],
                fill(source, case2, environment)[1],
            ]);
            deep_set(['resultCache', constraint, source], environment, [currentResult]);
            return [environment, currentResult];
        case ConstraintTypes.And:
            let [constraint1, constraint2] = parsedConstraint.constraint;
            // intentionally copied as the environment in simple case should be interdependent...
            // also due to extra length check for And cases
            for (let i = 1; source.length > 1 && currentResult.loss > 0 && i < source.length; i++) {
                let [_1, head] = fill(source.substr(0, i), constraint1, environment);
                // should use _1 instead of environment in case of non loopable?
                let [_2, tail] = fill(source.substr(i), constraint2, environment);
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
        case ConstraintTypes.Simple:
            if (isAlias(parsedConstraint.constraint, environment)) {
                return fill(source, environment.alias[parsedConstraint.constraint.substr(1)], environment);
            }
            if (isLoopable(constraint, environment)) {
                // Instead of skipping, should save all results with loss upper bounded
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
            }
            else {
                main: for (let vocabLength = source.length; vocabLength > 0; vocabLength--) {
                    for (let startIndex = 0; startIndex + vocabLength <= source.length; startIndex++) {
                        let toneSequence = source.substr(startIndex, vocabLength);
                        if (isFoundInDictionary(toneSequence, constraint, environment)) {
                            currentResult = {
                                loss: source.length - toneSequence.length,
                                result: [
                                    ...lossArray(startIndex),
                                    // losing other options here, consider Result to be string instead of string[]
                                    (environment.pick || optimized)(environment.dictionary[constraint][toneSequence]).result[0],
                                    ...lossArray(source.length - toneSequence.length - startIndex)
                                ]
                            };
                            break main;
                        }
                    }
                }
            }
            deep_set(['resultCache', constraint, source], environment, [currentResult]);
            return [environment, currentResult];
    }
}
exports.default = fill;
