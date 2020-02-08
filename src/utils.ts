import './types'

// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const idx: ( p: ( string | symbol )[], o: {} ) => any = ( p: ( string | symbol )[], o: {} ) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

const deep_set: ( successors: string[], object: {}, value: any ) => void = (p, o, v) => {
  for ( let i = 0; i < p.length - 1; i++ ) {
    o[p[i]] = o[p[i]] ? o[p[i]] : {};
    o = o[p[i]];
  }
  o[p[p.length - 1]] = v;
};

function isFoundInDictionary( source: string, constraint: string, environment: Environment ): Boolean {
  return idx( [ 'dictionary', constraint, source ], environment ) ? true : false;
}

function isFoundInResultCache( source: string, constraint: string, environment: Environment ): Boolean {
  return idx( [ 'resultCache', constraint, source ], environment ) ? true : false;
}

function isLoopable( constraint: string, environment: Environment ): Boolean {
  return idx( [ 'dictionary', constraint, LOOPABLE ], environment ) ? true : false;
}

function evaluateWith( environment: Environment ): ( CachedResult ) => WeightedResult {
  return result => {
    return ( typeof result.loss === 'number' ? result : {
      loss: result.loss(environment),
      result: result.result
    })
  };
}

function optimized( results: WeightedResult[] ): WeightedResult {
  return results.reduce( (p, c) => ( c.loss < p.loss ? c : p ), results[0] );
}

function parse( constraint: ConstraintString, environment: Environment ): Constraint {
  const orIndex = constraint.indexOf('|');
  if ( orIndex !== -1 ) {
    return {
      type: ConstraintTypes.Or,
      constraint: [ constraint.substr(0, orIndex), constraint.substr( orIndex+1 ) ]
    };
  }

  const andIndex = constraint.indexOf(',');
  if ( andIndex !== -1 ) {
    return {
      type: ConstraintTypes.And,
      constraint: [ constraint.substr(0, andIndex), constraint.substr( andIndex+1 ) ]
    }
  }

  return {
    type: ConstraintTypes.Simple,
    constraint: constraint
  };
}

function isAlias( constraint: ConstraintString, environment: Environment ): Boolean {
  return constraint[0] === ":" && idx( ['alias', constraint.substr(1)], environment );
}

function lossArray( length: number ): string[] {
  return Array(length).fill(EMPTY_MARKER);
}

export {
  idx,
  deep_set,
  isFoundInDictionary,
  isFoundInResultCache,
  isLoopable,
  evaluateWith,
  optimized,
  parse,
  isAlias,
  lossArray
}
