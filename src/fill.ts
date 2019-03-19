type ResultCache = {};
type Dictionary = {};
type SourceString = string;
type ConstraintString = string;
type Category = string;

enum ConstraintTypes {
  Simple, Or, And
}

interface Simple {
  type: ConstraintTypes.Simple;
  constraint: Category;
}

interface Or {
  type: ConstraintTypes.Or;
  constraint: ConstraintString[];
}

interface And {
  type: ConstraintTypes.And;
  constraint: ConstraintString[];
}

type Constraint = Simple | Or | And;

/* dictionary: { [ConstraintString]: { [SourceString]: WeightedResult[] } } */
interface Environment {
  dictionary: Dictionary;
  resultCache?: ResultCache;
  pick?( results: WeightedResult[] ): WeightedResult;
  accumulate?( result1: WeightedResult, result2: WeightedResult ): WeightedResult;
  alias?: {};
}

type Result = string[];

interface CachedResult {
  loss: number | ( (Environment) => number );
  result: Result;
}

interface WeightedResult {
  loss: number;
  result: Result;
}

// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const idx: ( successors: string[], object: {} ) => any = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
const deep_set: ( successors: string[], object: {}, value: any ) => void = (p, o, v) => {
  for ( let i = 0; i < p.length - 1; i++ ) {
    o[p[i]] = o[p[i]] ? o[p[i]] : {};
    o = o[p[i]];
  }
  o[p[p.length - 1]] = v;
};

function isFoundInDictionary( source: string, constraint: string, environment: Environment ): Boolean {
  // conceptually environment.resultCache[constraint][source];
  return idx( [ 'dictionary', constraint, source ], environment ) ? true : false;
}

function isFoundInResultCache( source: string, constraint: string, environment: Environment ): Boolean {
  // conceptually environment.resultCache[constraint][source];
  return idx( [ 'resultCache', constraint, source ], environment ) ? true : false;
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

function fill(
  source: SourceString,
  constraint: ConstraintString,
  environment: Environment
): [ Environment, WeightedResult ] {
  if ( isFoundInResultCache( source, constraint, environment ) ) {
    let cachedResults: CachedResult[] = environment.resultCache[constraint][source];
    return [ environment, ( environment.pick || optimized )( cachedResults.map(evaluateWith(environment)) ) ];
  }

  if ( isFoundInDictionary( source, constraint, environment ) ) {
    let weightedResults: WeightedResult[] = environment.dictionary[constraint][source];
    deep_set( [ 'resultCache', constraint, source ], environment, weightedResults );
    return [ environment, ( environment.pick || optimized )( weightedResults ) ];
  }

  const parsedConstraint:Constraint = parse( constraint, environment );

  let currentResult: WeightedResult = {
    loss: source.length,
    result: Array(source.length).fill('')
  };

  switch( parsedConstraint.type ) {
    case ConstraintTypes.Or:
      let [ case1, case2 ] = parsedConstraint.constraint;

      currentResult = optimized([
        fill( source, case1, environment )[1],
        fill( source, case2, environment )[1],
      ]);

      deep_set( [ 'resultCache', constraint, source ], environment, [ currentResult ] );

      return [ environment, currentResult ];


    case ConstraintTypes.And:
      let [ constraint1, constraint2 ] = parsedConstraint.constraint;
      // intentionally copied as the environment in simple case should be interdependent...
      // also due to extra length check for And cases
      for ( let i = 1; source.length > 1 && currentResult.loss > 0 && i < source.length; i++ ) {
        let [ _1, head ] = fill( source.substr( 0, i ), constraint1, environment );
        // should use _1 instead of environment in case of non loopable?
        let [ _2, tail ] = fill( source.substr( i ), constraint2, environment );

        let tempResult: WeightedResult = (
          environment.accumulate || ( ( h, t ) => ({
            loss: h.loss + t.loss,
            result: h.result.concat(t.result)
          } ) )
        )( head, tail );

        if ( currentResult.loss > tempResult.loss ) {
          currentResult = tempResult;
        }
      }

      deep_set( [ 'resultCache', constraint, source ], environment, [ currentResult ] );

      return [ environment, currentResult ];


    case ConstraintTypes.Simple:
      if ( isAlias( parsedConstraint.constraint, environment ) ) {
        return fill( source, environment.alias[ parsedConstraint.constraint.substr(1) ], environment );
      }

      // Instead of skipping, save all results with loss upper bounded
      for ( let i = 1; currentResult.loss > 0 && i < source.length; i++ ) {
        let [ _1, head ] = fill( source.substr( 0, i ), constraint, environment );
        // should use _1 instead of environment in case of non loopable?
        let [ _2, tail ] = fill( source.substr( i ), constraint, environment );

        let tempResult: WeightedResult = (
          environment.accumulate || ( ( h, t ) => ({
            loss: h.loss + t.loss,
            result: h.result.concat(t.result)
          } ) )
        )( head, tail );

        if ( currentResult.loss > tempResult.loss ) {
          currentResult = tempResult;
        }
      }

      deep_set( [ 'resultCache', constraint, source ], environment, [ currentResult ] );

      return [ environment, currentResult ];
  }
}

module.exports = fill;
