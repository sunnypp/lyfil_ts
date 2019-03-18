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

function foundInResultCache( source: string, constraint: string, environment: Environment ): Boolean {
  // conceptually environment.resultCache[constraint][source];
  return idx( [ 'resultCache', constraint, source ], environment ) ? true : false;
}

function cached( source: SourceString, constraint: ConstraintString, environment: Environment ): CachedResult[] {
  return environment.resultCache[constraint][source];
}

function evaluateWith( environment: Environment ): ( CachedResult ) => WeightedResult {
  // will be evaluated according to current environment status in the future
  return result => ( typeof result.loss === 'number' ? result : {
    loss: result.loss(environment),
    result: result.result
  });
}

function optimized( results: WeightedResult[] ): WeightedResult {
  return results.reduce( (p, c) => ( c.loss < p.loss ? c : p ), results[0] );
}

function fill(
  source: SourceString,
  constraint: ConstraintString,
  environment: Environment
): WeightedResult {
  if ( foundInResultCache( source, constraint, environment ) ) {
    let cachedResults: CachedResult[] =  cached( source, constraint, environment );
    return ( environment.pick || optimized )( cachedResults.map(evaluateWith(environment)) );
  }

  return {
    loss: source.length,
    result: []
  }
}

module.exports = fill;
