// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
export default ( p: ( string | symbol )[], o: {} ) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

