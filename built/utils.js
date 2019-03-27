"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
exports.default = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
