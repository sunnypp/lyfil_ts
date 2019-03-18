const assert = require('assert').strict;

const fill = require('./built/fill.js');

const tests = [
  [ [ 'xx', 'a', { resultCache: { a: {} } } ], { loss: 2, result: [] }, 'Loss = length when failed (2 chars)' ],
  [ [ 'xxx', 'a', { resultCache: { a: {} } } ], { loss: 3, result: [] }, 'Loss = length when failed (3 chars)' ],
  [ [ 'xx', 'a', { resultCache: { a: { xx: [ { loss: 0, result: ['1'] } ] } } } ], { loss: 0, result: [ '1' ] }, 'Make use of the resultCache' ],
  [ [ 'xx', 'a', { resultCache: { a: { xx: [ { loss: 1, result: ['2'] }, { loss: 0, result: ['1'] } ] } } } ], { loss: 0, result: [ '1' ] }, 'Use the cached value with the least loss' ],
  [ [ 'xx', 'a', {
    resultCache: { a: { xx: [ { loss: 1, result: ['2'] }, { loss: 0, result: ['1'] } ] } },
    pick: rs => rs[0],
  } ], { loss: 1, result: [ '2' ] }, 'Use the pick() in environment' ],
];

for ( let test of tests ) {
  assert.deepStrictEqual(
    fill(...test[0]),
    test[1],
  );
}
