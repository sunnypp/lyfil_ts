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

t.test( 'Dictionary with Simple Constraint', { autoend: true },
  t => {
    // found directly
    t.same( fill( '1', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 0, result: [ '9' ] }, "Found directly char" );
    t.same( fill( '12', 'a', { dictionary: { a: { '12': [{ loss: 0, result: ['98'] }] } } } )[1], { loss: 0, result: ['98'] }, "Found directly vocab" );

    // not found completely
    t.same( fill( '2', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1].loss, 1, "Not found char" );
    t.same( fill( '23', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1].loss, 2, "Not found vocab" );

    // found partially loopable
    t.same( fill( '11', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 0, result: [ '9', '9' ] }, "pattern: oo" );
    t.same( fill( '21', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 1, result: [ '', '9' ] }, "pattern: xo" );
    t.same( fill( '121', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 1, result: [ '9', '', '9' ] }, "pattern: oxo" );
    t.same( fill( '1213', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 2, result: [ '9', '', '9', '' ] }, "pattern: oxox" );
    t.same( fill( '1213', 'a', { dictionary: { a: {
      '1': [{ loss: 0, result: [ '9' ] }],
      '2': [{ loss: 0, result: [ '8' ] }]
    } } } )[1], { loss: 1, result: [ '9', '8', '9', '' ] }, "pattern: ooox" );
    t.same( fill( '1213', 'a', { dictionary: { a: {
      '1': [{ loss: 0, result: [ '9' ] }],
      '21': [{ loss: 0, result: [ '89' ] }]
    } } } )[1], { loss: 1, result: [ '9', '89', '' ] }, "pattern: o[oo]x" );

    // optimize
    t.same( fill( '1213', 'a', { dictionary: { a: {
      '1': [{ loss: 0, result: [ '9' ] }],
      '12': [{ loss: 0, result: [ '98' ] }]
    } } } )[1], { loss: 1, result: [ '98', '9', '' ] }, "pattern: [oo]ox" );

    t.same( fill( '312', 'a', { dictionary: { a: {
      '1': [{ loss: 0, result: [ '9' ] }],
      '12': [{ loss: 0, result: [ '98' ] }]
    } } } )[1], { loss: 1, result: [ '', '98' ] }, "pattern: x[oo]" );

    t.same( fill( '123', 'a', { dictionary: { a: {
      '1': [{ loss: 0, result: [ '9' ] }],
      '12': [{ loss: 0, result: [ '98' ] }]
    } } } )[1], { loss: 1, result: [ '98', '' ] }, "pattern: [oo]x" );

    t.same( fill( '12321', 'a', { dictionary: { a: {
      '1': [{ loss: 0, result: [ '9' ] }],
      '12': [{ loss: 0, result: [ '98' ] }],
      '23': [{ loss: 0, result: [ '87' ] }],
      '321': [{ loss: 0, result: [ '789' ] }],
    } } } )[1], { loss: 0, result: [ '98', '789' ] }, "pattern: [oo][ooo]" );

    t.same( fill( '12321', 'a', { dictionary: { a: {
      '1': [{ loss: 0, result: [ '9' ] }],
      '12': [{ loss: 0, result: [ '98' ] }],
      '23': [{ loss: 0, result: [ '87' ] }],
      '21': [{ loss: 0, result: [ '89' ] }],
    } } } )[1], { loss: 0, result: [ '9', '87', '89' ] }, "pattern: o[oo][oo]" );

    t.same( fill('12321', 'a', {
      dictionary: { a: {
        '1': [{ loss: 0, result: [ '9' ] }],
        '12': [{ loss: 0, result: [ '98' ] }],
        '23': [{ loss: 2, result: [ '87' ] }],
        '21': [{ loss: 0, result: [ '89' ] }]
      } },
      // beware of the type WeightedResult.  result has to be string[]
      accumulate: ( h, t ) => ({
        loss: h.loss + t.loss,
        result: [ ( h.result[0] || '0' ) + ( t.result[0] || '0' ) ]
      })
    })[1], { loss: 1, result: [ '98089' ] }, "pattern: [oo]x[oo] by loss with accumulate" );
  }
);

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

t.only( 'AND Constraint', { autoend: true },
  t => {

    t.test( 'Complete cases (match or fail all)', { autoend: true }, t => {
      t.same( fill( '1', 'a,b', { dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] }
      } } )[1].loss, 1, "Return max loss if 1 char splits into 2" );

      t.same( fill( '12', 'a,b', { dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] }
      } } )[1].result, [ '9', '8' ], "Successful And" );

      t.same( fill( '12', 'a,b', { dictionary: {
        a: { '2': [{ loss: 0, result: [ '8' ] }] },
        b: { '1': [{ loss: 0, result: [ '9' ] }] },
      } } )[1].loss, 2, "Fail all due to forced missing a or b" );

    });

    t.test( 'Partial cases', { autoend: true }, t => {
      t.same( fill( '12', 'a,b', { dictionary: {
        a: { '2': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] }
      } } )[1], {
        loss: 1,
        result: [ '', '8' ]
      }, "x2" );

      t.same( fill( '12', 'a,b', { dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '4': [{ loss: 0, result: [ '8' ] }] }
      } } )[1], {
        loss: 1,
        result: [ '9', '' ]
      }, "1x" );

      t.same( fill( '123', 'a,b,c', { dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '4': [{ loss: 0, result: [ '8' ] }] },
        c: { '3': [{ loss: 0, result: [ '7' ] }] }
      } } )[1], {
        loss: 1,
        result: [ '9', '', '7' ]
      }, "1x3" );

      t.same( fill( '123', 'a,b', { dictionary: {
        a: { '2': [{ loss: 0, result: [ '8' ] }] },
        b: { '1': [{ loss: 0, result: [ '9' ] }] },
      } } )[1].loss, 2, "x1x" );

      // missing a part of a complete sentence isn't good, so 900 instead of 987
      t.same( fill( '123', 'a,b,c', { dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '4': [{ loss: 0, result: [ '8' ] }] },
        c: { '23': [{ loss: 0, result: [ '87' ] }] }
      } } )[1], {
        loss: 2,
        result: [ '9', '', '' ]
      }, "1xx" );
    });

    t.test( 'Complex cases', { autoend: true }, t => {
      t.same( fill( '1213', 'a,b', { dictionary: {
        a: {
          '1': [{ loss: 0, result: [ '9' ] }],
          '12': [{ loss: 0, result: [ '98' ] }]
        },
        b: { '3': [{ loss: 0, result: [ '7' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '98', '9', '7' ]
      }, "1112" );

      t.same( fill( '1213', 'a,b', { dictionary: {
        a: {
          '1': [{ loss: 0, result: [ '9' ] }],
          '12': [{ loss: 0, result: [ '98' ] }]
        },
        b: { '13': [{ loss: 0, result: [ '97' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '98', '97' ]
      }, "1122" );

      t.same( fill( '1213', 'a,b', { dictionary: {
        a: {
          '1': [{ loss: 0, result: [ '9' ] }],
          '12': [{ loss: 0, result: [ '98' ] }]
        },
        b: { '213': [{ loss: 0, result: [ '897' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '9', '897' ]
      }, "1222" );

      t.same( fill( '12321', 'a,b', { dictionary: {
        a: {
          '1': [{ loss: 0, result: [ '9' ] }],
          '12': [{ loss: 0, result: [ '98' ] }],
          '23': [{ loss: 0, result: [ '87' ] }],
          '321': [{ loss: 0, result: [ '789' ] }],
        },
        b: { '321': [{ loss: 0, result: [ 'ggg' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '98', 'ggg' ]
      }, "11222, not skipping 2nd" );

      t.same( fill( '12321', 'a,b', { dictionary: {
        a: {
          '1': [{ loss: 0, result: [ '9' ] }],
          '12': [{ loss: 0, result: [ '98' ] }],
          '23': [{ loss: 0, result: [ '87' ] }],
          '21': [{ loss: 0, result: [ '89' ] }],
        },
        b: { '21': [{ loss: 0, result: [ 'gg' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '9', '87', 'gg' ]
      }, "1[11][22]" );

    });
  }
);
