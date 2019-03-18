const t = require('tap');
const fill = require('./built/fill.js');

t.test( 'Basic settings', { autoend: true }, t => {
  t.same( fill( 'xx', 'a', { resultCache: { a: {} } } )[1].loss, 2, 'Loss = length when failed (2 chars)' );
  t.same( fill( 'xxx', 'a', { resultCache: { a: {} } } )[1].loss, 3, 'Loss = length when failed (3 chars)' );
  t.same( fill( 'xx', 'a', { resultCache: { a: { xx: [ { loss: 0, result: ['1'] } ] } } } )[1].loss, 0, 'Make use of the resultCache' );
  t.same( fill( 'xx', 'a', { resultCache: { a: { xx: [ { loss: 1, result: ['2'] }, { loss: 0, result: ['1'] } ] } } } )[1].loss, 0, 'Use the cached value with the least loss' );
  t.same( fill( 'xx', 'a', {
    resultCache: { a: { xx: [ { loss: 1, result: ['2'] }, { loss: 0, result: ['1'] } ] } },
    pick: rs => rs[0],
  } )[1], { loss: 1, result: [ '2' ] }, 'Use the pick() in environment' );
});

// t.only( 'Dictionary with Simple Constraint', { autoend: true },
//   t => {
//     // found directly
//     t.same( fill( '1', 'a', { dictionary: { a: { '1': ['9'] } } } ), { loss: 0, result: [ '9' ] }, "Found directly char" );
//     // t.same( fill( '12', [ [ { 12: 98 } ] ] ), { loss: 0, result: 98 }, "Found directly vocab" );

//     // // not found completely
//     // t.same( fill( '2', [ [ { 1: 9 } ] ] ), { loss: 1, result: 0 }, "Not found char" );
//     // t.same( fill( '23', [ [ { 1: 9 } ] ] ), { loss: 2, result: '00' }, "Not found vocab" );

//     // // found partially
//     // t.same( fill( '11', [ [ { 1: 9 } ] ] ), { loss: 0, result: 99 }, "pattern: oo" );
//     // t.same( fill( '21', [ [ { 1: 9 } ] ] ), { loss: 1, result: '09' }, "pattern: xo" );
//     // t.same( fill( '121', [ [ { 1: 9 } ] ] ), { loss: 1, result: '909' }, "pattern: oxo" );
//     // t.same( fill( '1213', [ [ { 1: 9 } ] ] ), { loss: 2, result: '9090' }, "pattern: oxox" );
//     // t.same( fill( '1213', [ [ { 1: 9, 2: 8 } ] ] ), { loss: 1, result: '9890' }, "pattern: ooox" );
//     // t.same( fill( '1213', [ [ { 1: 9, 21: 89 } ] ] ), { loss: 1, result: '9890' }, "pattern: o[oo]x" );

//     // // optimize
//     // t.same( fill( '1213', [ [ { 1: 9, 12: 98 } ] ] ), { loss: 1, result: '9890' }, "pattern: [oo]ox" );
//     // t.same( fill( '312', [ [ { 1: 9, 12: 98 } ] ] ), { loss: 1, result: '098' }, "pattern: x[oo]" );
//     // t.same( fill( '123', [ [ { 1: 9, 12: 98 } ] ] ), { loss: 1, result: '980' }, "pattern: [oo]x" );
//     // t.same( fill( '12321', [ [ { 1: 9, 12: 98, 23: 87, 321: 789 } ] ] ), { loss: 0, result: '98789' }, "pattern: [oo][ooo]" );
//     // t.same( fill( '12321', [ [ { 1: 9, 12: 98, 23: 87, 21: 89 } ] ] ), { loss: 0, result: '98789' }, "pattern: o[oo][oo]" );
//   }
// );

// t.test( '2 seq, 1 dict', { autoend: true },
//   t => {
//     // found directly
//     t.same( fill( [ '1' ], [ [ { 1: 9 } ], [ { 2: 8 } ] ] ), { loss: 0, result: 9 }, "Found directly char" );
//     t.same( fill( [ '1' ], [ [ { 2: 8 } ], [ { 1: 9 } ] ] ), { loss: 0, result: 9 }, "Found directly char" );
//     t.same( fill( [ '12' ], [ [ { 12: 98 } ], [ { 21: 89 } ] ] ), { loss: 0, result: 98 }, "Found directly vocab" );
//     t.same( fill( [ '12' ], [ [ { 21: 89 } ], [ { 12: 98 } ] ] ), { loss: 0, result: 98 }, "Found directly vocab" );

//     // not found completely
//     t.same( fill( [ '2' ], [ [ { 1: 9 } ], [ { 3: 7 } ] ] ), { loss: 1, result: 0 }, "Not found char" );
//     t.same( fill( [ '23' ], [ [ { 4: 6 } ], [ { 1: 9 } ] ] ), { loss: 2, result: '00' }, "Not found vocab" );

//     t.test( 'found partially, prioritize 1st', { autoend: true }, t => {
//       t.same( fill( [ '11' ], [ [ { 1: 9 } ], [ { 1: 7 } ] ] ), { loss: 0, result: 99 }, "pattern: 11" );
//       t.same( fill( [ '21' ], [ [ { 1: 9 } ], [ { 2: 8 } ] ] ), { loss: 1, result: '09' }, "pattern: x1" );
//       t.same( fill( [ '121' ], [ [ { 21: 98 } ], [ { 1: 9 } ] ] ), { loss: 1, result: '098' }, "pattern: 0[11]" );
//       t.same( fill( [ '1213' ], [ [ { 23: 87 } ], [ { 1: 9 } ] ] ), { loss: 2, result: '9090' }, "pattern: 2x2x" );
//       t.same( fill( [ '1213' ], [ [ { 21: 89, 3: 7 } ], [ { 1: 9, 2: 8 } ] ] ), { loss: 1, result: '0897' }, "pattern: x[22]2" );
//       t.same( fill( [ '1213' ], [ [ { 1: 9, 21: 89 } ], [ { 213: 897 } ] ] ), { loss: 1, result: '9890' }, "pattern: 1[11]x" );
//     });

//   }
// );

// t.test( '1 seq, 2 dict', { autoend: true },
//   t => {

//     t.test( 'Complete cases', { autoend: true }, t => {
//       t.same( fill( ['1'], [ [ { 1: 9 }, { 2: 8 } ] ] ), { loss: 1, result: 0 }, "bail out if dict > src" );
//       t.same( fill( ['12'], [ [ { 1: 9 }, { 2: 8 } ] ] ), { loss: 0, result: '98' }, "12" );
//       t.same( fill( ['12'], [ [ { 3: 7 }, { 4: 6 } ] ] ), { loss: 2, result: '00' }, "no result" );
//     });

//     t.test( 'Partial cases', { autoend: true }, t => {
//       t.same( fill( ['12'], [ [ { 2: 9 }, { 2: 8 } ] ] ), { loss: 1, result: '08' }, "x2" );
//       t.same( fill( ['12'], [ [ { 1: 9 }, { 4: 6 } ] ] ), { loss: 1, result: '90' }, "1x" );
//       t.same( fill( ['123'], [ [ { 1: 9 }, { 4: 6 }, { 3: 7 } ] ] ), { loss: 1, result: '907' }, "1x3" );
//       // missing a part of a complete sentence isn't good, so 900 instead of 987
//       t.same( fill( ['123'], [ [ { 1: 9 }, { 4: 6 }, { 23: 87 } ] ] ), { loss: 2, result: '900' }, "1xx" );
//     });

//     t.test( 'Complex cases', { autoend: true }, t => {
//       t.same( fill( [ '1213' ], [ [ { 1: 9, 12: 98 }, { 3: 7 } ] ] ), { loss: 0, result: '9897' }, "pattern: 1112" );
//       t.same( fill( [ '1213' ], [ [ { 1: 9, 12: 98 }, { 13: 97 } ] ] ), { loss: 0, result: '9897' }, "pattern: 1122" );
//       t.same( fill( [ '1213' ], [ [ { 1: 9, 12: 98 }, { 213: 897 } ] ] ), { loss: 0, result: '9897' }, "pattern: [ooo]x" );
//       t.same( fill( [ '12321' ], [ [ { 1: 9, 12: 98, 23: 87, 321: 789 }, { 321: 'ggg' } ] ] ), { loss: 0, result: '98ggg' }, "pattern: [oo][ooo]" );
//       t.same( fill( [ '12321' ], [ [ { 1: 9, 12: 98, 23: 87, 21: 89 }, { 21: 'gg' } ] ] ), { loss: 0, result: '987gg' }, "pattern: o[oo][oo]" );
//     });

//   }
// );
