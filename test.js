const t = require('tap');
const fill = require('./built/fill.js').default;
const LOOPABLE = Symbol.for('LOOPABLE');

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
    t.test( 'found directly', { autoend: true }, t => {
      t.same( fill( '1', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 0, result: [ '9' ] }, "Found directly char" );
      t.same( fill( '12', 'a', { dictionary: { a: { '12': [{ loss: 0, result: ['98'] }] } } } )[1], { loss: 0, result: ['98'] }, "Found directly vocab" );
    });

    t.test( 'not found completely', { autoend: true }, t => {
      t.same( fill( '2', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1].loss, 1, "Not found char" );
      t.same( fill( '23', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1].loss, 2, "Not found vocab" );
    });

    // found partially loopable
    t.test( 'Found loopable',
      t => {
        t.same( fill( '11', 'a', { dictionary: { a: { [Symbol.for('LOOPABLE')]: true, '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 0, result: [ '9', '9' ] }, "pattern: oo");
        t.end();
      }
    )
    t.same( fill( '21', 'a', { dictionary: { a: { '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 1, result: [ '', '9' ] }, "pattern: xo" );
    t.same( fill( '121', 'a', { dictionary: { a: { [Symbol.for('LOOPABLE')]: true, '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 1, result: [ '9', '', '9' ] }, "pattern: oxo" );
    t.same( fill( '1213', 'a', { dictionary: { a: { [Symbol.for('LOOPABLE')]: true, '1': [{ loss: 0, result: [ '9' ] }] } } } )[1], { loss: 2, result: [ '9', '', '9', '' ] }, "pattern: oxox" );
    t.same( fill( '1213', 'a', { dictionary: { a: {
       [Symbol.for('LOOPABLE')]: true,
      '1': [{ loss: 0, result: [ '9' ] }],
      '2': [{ loss: 0, result: [ '8' ] }]
    } } } )[1], { loss: 1, result: [ '9', '8', '9', '' ] }, "pattern: ooox" );
    t.same( fill( '1213', 'a', { dictionary: { a: {
       [Symbol.for('LOOPABLE')]: true,
      '1': [{ loss: 0, result: [ '9' ] }],
      '21': [{ loss: 0, result: [ '89' ] }]
    } } } )[1], { loss: 1, result: [ '9', '89', '' ] }, "pattern: o[oo]x" );

    // optimize
    t.same( fill( '1213', 'a', { dictionary: { a: {
       [Symbol.for('LOOPABLE')]: true,
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
       [Symbol.for('LOOPABLE')]: true,
      '1': [{ loss: 0, result: [ '9' ] }],
      '12': [{ loss: 0, result: [ '98' ] }],
      '23': [{ loss: 0, result: [ '87' ] }],
      '321': [{ loss: 0, result: [ '789' ] }],
    } } } )[1], { loss: 0, result: [ '98', '789' ] }, "pattern: [oo][ooo]" );

    t.same( fill( '12321', 'a', { dictionary: { a: {
       [Symbol.for('LOOPABLE')]: true,
      '1': [{ loss: 0, result: [ '9' ] }],
      '12': [{ loss: 0, result: [ '98' ] }],
      '23': [{ loss: 0, result: [ '87' ] }],
      '21': [{ loss: 0, result: [ '89' ] }],
    } } } )[1], { loss: 0, result: [ '9', '87', '89' ] }, "pattern: o[oo][oo]" );

    t.same( fill('12321', 'a', {
      dictionary: { a: {
       [Symbol.for('LOOPABLE')]: true,
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

t.test( 'OR Constraint', { autoend: true },
  t => {

    t.test( 'Complete cases (match or fail all)', { autoend: true }, t => {
      t.same( fill( '1', 'a|b', { dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '9' ]
      }, "Found char directly in first case" );

      t.same( fill( '1', 'b|a', { dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '9' ]
      }, "Found char directly in second case" );

      t.same( fill( '12', 'a|b', { dictionary: {
        a: { '12': [{ loss: 0, result: [ '98' ] }] },
        b: { '21': [{ loss: 0, result: [ '89' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '98' ]
      }, "Found vocab in first case" );

      t.same( fill( '12', 'b|a', { dictionary: {
        a: { '12': [{ loss: 0, result: [ '98' ] }] },
        b: { '21': [{ loss: 0, result: [ '89' ] }] }
      } } )[1], {
        loss: 0,
        result: [ '98' ]
      }, "Found vocab in second case" );

      t.same( fill( '1', 'b|a', { dictionary: {
        a: { '3': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] }
      } } )[1].loss, 1, "Not found char" );

      t.same( fill( '12', 'a|b', { dictionary: {
        a: { '23': [{ loss: 0, result: [ '98' ] }] },
        b: { '21': [{ loss: 0, result: [ '89' ] }] }
      } } )[1].loss, 2, "Not found vocab" );

      t.same( fill( '11', 'a|b', { dictionary: {
        a: {
          [Symbol.for('LOOPABLE')]: true,
          '1': [{ loss: 0, result: [ '9' ] }]
        },
        b: {
          [Symbol.for('LOOPABLE')]: true,
          '1': [{ loss: 0, result: [ '7' ] }]
        }
      } } )[1], {
        loss: 0,
        result: [ '9', '9' ]
      }, "11 prioritizing 1st case" );

    });

    t.test( 'Partial cases prioritizing 1st case', { autoend: true }, t => {

      t.same( fill( '21', 'a|b', { dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] }
      } } )[1], {
        loss: 1,
        result: [ '', '9' ]
      }, "x1" );

      t.same( fill( '121', 'a|b', { dictionary: {
        a: { '21': [{ loss: 0, result: [ '89' ] }] },
        b: { '1': [{ loss: 0, result: [ '9' ] }] }
      } } )[1], {
        loss: 1,
        result: [ '', '89' ]
      }, "011 by 1st case" );

      t.same( fill( '121', 'b|a', { dictionary: {
        a: { '21': [{ loss: 0, result: [ '89' ] }] },
        b: {
          [Symbol.for('LOOPABLE')]: true,
          '1': [{ loss: 0, result: [ '9' ] }]
        }
      } } )[1], {
        loss: 1,
        result: [ '9', '', '9' ]
      }, "202 by 1st case" );

      t.same( fill( '121', 'b|a', { dictionary: {
        a: { '21': [{ loss: 0, result: [ '89' ] }] },
        b: { '1': [{ loss: 0, result: [ '9' ] }] }
      } } )[1], {
        loss: 1,
        result: [ '', '89' ]
      }, "Optimized to use less loss without loopable" );

      t.same( fill( '1213', 'a|b', { dictionary: {
        a: { '23': [{ loss: 0, result: [ '87' ] }] },
        b: { '1': [{ loss: 0, result: [ '9' ] }] }
      } } )[1], {
        loss: 3,
        result: [ '9', '', '', '' ]
      }, "First case no use, apply 2nd once due to non-loopable" );

      t.same( fill( '1213', 'a|b', { dictionary: {
        a: {
          [Symbol.for('LOOPABLE')]: true,
          '3': [{ loss: 0, result: [ '7' ] }],
          '21': [{ loss: 0, result: [ '89' ] }]
        },
        b: {
          [Symbol.for('LOOPABLE')]: true,
          '1': [{ loss: 0, result: [ '9' ] }],
          '2': [{ loss: 0, result: [ '8' ] }]
        }
      } } )[1], {
        loss: 1,
        result: [ '', '89', '7' ]
      }, "Compare loss of 2 repeatedly applied cases" );

      t.same( fill( '1213', 'b|a', { dictionary: {
        a: {
          [Symbol.for('LOOPABLE')]: true,
          '3': [{ loss: 0, result: [ '7' ] }],
          '21': [{ loss: 0, result: [ '89' ] }]
        },
        b: {
          [Symbol.for('LOOPABLE')]: true,
          '1': [{ loss: 0, result: [ '9' ] }],
          '2': [{ loss: 0, result: [ '8' ] }]
        }
      } } )[1], {
        loss: 1,
        result: [ '9', '8', '9', '' ]
      }, "Compare loss of 2 repeatedly applied cases with ordering" );

      t.same( fill( '1213', 'a|b', { dictionary: {
        a: {
          [Symbol.for('LOOPABLE')]: true,
          '1': [{ loss: 0, result: [ '9' ] }],
          '21': [{ loss: 0, result: [ '89' ] }]
        },
        b: {
          '213': [{ loss: 0, result: [ '897' ] }],
        }
      } } )[1], {
        loss: 1,
        result: [ '9', '89', '' ]
      }, "Pattern: 1[11]x" );

    });

  }
);

t.test( 'AND Constraint', { autoend: true },
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
          [Symbol.for('LOOPABLE')]: true,
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
          [Symbol.for('LOOPABLE')]: true,
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

t.test( 'OR taken before AND', { autoend: true },
  t => {

    t.same( fill( '123', 'a,b|c', { dictionary: {
      a: { '1': [{ loss: 0, result: [ '9' ] }] },
      b: { '2': [{ loss: 0, result: [ '8' ] }] },
      c: { '3': [{ loss: 0, result: [ '7' ] }] }
    } } )[1], {
      loss: 1,
      result: [ '9', '8', '' ]
    }, "(a,b) | c, returning a+b due to less loss" );

    t.same( fill( '123', 'a|b,c', { dictionary: {
      a: { '1': [{ loss: 0, result: [ '9' ] }] },
      b: { '2': [{ loss: 0, result: [ '8' ] }] },
      c: { '3': [{ loss: 0, result: [ '7' ] }] }
    } } )[1], {
      loss: 1,
      result: [ '', '8', '7' ]
    }, "a | ( b,c ), returning b+c due to less loss" );

    t.same( fill( '123', 'b,c|a,b,c', { dictionary: {
      a: { '1': [{ loss: 0, result: [ '9' ] }] },
      b: { '2': [{ loss: 0, result: [ '8' ] }] },
      c: { '3': [{ loss: 0, result: [ '7' ] }] }
    } } )[1], {
      loss: 0,
      result: [ '9', '8', '7' ]
    }, "( b,c ) | ( a,b,c ), returning a+b+c due to less loss" );

  }
);

t.test( 'Complex Or and And with Alias', { autoend: true },
  t => {

    t.same( fill('123', ':alias', {
      dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] },
        c: { '3': [{ loss: 0, result: [ '7' ] }] }
      },
      alias: {
        alias: 'a,b|c'
      }
    })[1], {
      loss: 1,
      result: [ '9', '8', '' ]
    }, "alias => (a,b) | c, returning a+b due to less loss" );

    t.same( fill('123', ':a1', {
      dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] },
        c: { '3': [{ loss: 0, result: [ '7' ] }] }
      },
      alias: {
        a1: ':a2|b,c',
        a2: 'a'
      }
    })[1], {
      loss: 1,
      result: [ '', '8', '7' ]
    }, "Nested alias a | ( b,c ), returning b+c due to less loss" );

    t.same( fill('123', ':A', {
      dictionary: {
        a: { '1': [{ loss: 0, result: [ '9' ] }] },
        b: { '2': [{ loss: 0, result: [ '8' ] }] },
        c: { '3': [{ loss: 0, result: [ '7' ] }] }
      },
      alias: {
        A: ':a1|:a2',
        a1: 'b,c',
        a2: 'a,:a1'
      }
    })[1], {
      loss: 0,
      result: [ '9', '8', '7' ]
    }, "( b,c ) | ( a,b,c ), returning a+b+c due to less loss" );

  }
);
