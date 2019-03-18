const assert = require('assert').strict;

const fill = require('./built/fill.js');

const tests = [
  [ [ 'xx', 'a', { dictionary: { a: {} } } ], { loss: 2, result: [] }, 'Loss = length when failed (2 chars)' ],
  [ [ 'xxx', 'a', { dictionary: { a: {} } } ], { loss: 3, result: [] }, 'Loss = length when failed (3 chars)' ],
  [ [ 'xx', 'a', { dictionary: { a: { xx: [ { loss: 0, result: ['1'] } ] } } } ], { loss: 0, result: [ '1' ] }, 'Make use of the dictionary' ],
];

for ( let test of tests ) {
  assert.deepStrictEqual(
    fill(...test[0]),
    test[1],
  );
}
