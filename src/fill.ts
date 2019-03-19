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
  type: ConstraintTypes.And;
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
  resultCache: ResultCache;
  pick?( results: WeightedResult[] ): WeightedResult;
  accumulate?( result1: WeightedResult, result2: WeightedResult ): WeightedResult;
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
  return {
    type: ConstraintTypes.Simple,
    constraint: constraint
  };
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

  switch( parsedConstraint.type ) {
    case ConstraintTypes.Simple:
      let minimumLoss = source.length;
      let result:Result = Array(source.length).fill('');

      // Instead of skipping, save all results with loss upper bounded
      for ( let i = 1; minimumLoss > 0 && i < source.length; i++ ) {
        let [ _1, head ] = fill( source.substr( 0, i ), constraint, environment );
        // should use _1 instead of environment in case of non loopable?
        let [ _2, tail ] = fill( source.substr( i ), constraint, environment );
        let loss = head.loss + tail.loss;
        if ( minimumLoss > loss ) {
          minimumLoss = loss;
          result = head.result.concat(tail.result);
        }
      }

      let returnedResult: WeightedResult = {
        loss: minimumLoss,
        result: result
      };
      deep_set( [ 'resultCache', constraint, source ], environment, [ returnedResult ] );

      return [ environment, returnedResult ];
  }
}

module.exports = fill;
