// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const idx = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
function foundInCache(source, constraint, environment) {
    // conceptually environment.cache[constraint][source];
    return idx(['cache', constraint, source], environment) ? true : false;
}
function cached(source, constraint, environment) {
    return environment.cache[constraint][source];
}
function fill(source, constraint, environment) {
    return {
        loss: source.length,
        result: []
    };
}
module.exports = fill;
