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
  pick?( results: WeightedResult[] ): WeightedResult;
}

type Result = string[];

interface WeightedResult {
  loss: number;
  result: Result;
}

// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const idx: ( successors: string[], object: {} ) => any = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

function foundInDictionary( source: string, constraint: string, environment: Environment ): Boolean {
  // conceptually environment.dictionary[constraint][source];
  return idx( [ 'dictionary', constraint, source ], environment ) ? true : false;
}

function cached( source: SourceString, constraint: ConstraintString, environment: Environment ): WeightedResult[] {
  return environment.dictionary[constraint][source];
}

function evaluateWith( environment: Environment ): ( result: WeightedResult ) => WeightedResult {
  // will be evaluated according to current environment status in the future
  return result => result;
}

function optimized( results: WeightedResult[] ): WeightedResult {
  return results.reduce( (p, c) => ( c.loss < p.loss ? c : p ), results[0] );
}

function fill(
  source: SourceString,
  constraint: ConstraintString,
  environment: Environment
): WeightedResult {
  if ( foundInDictionary( source, constraint, environment ) ) {
    let cachedResults: WeightedResult[] =  cached( source, constraint, environment );
    return ( environment.pick || optimized )( cachedResults.map(evaluateWith(environment)) );
  }

  return {
    loss: source.length,
    result: []
  }
}

module.exports = fill;
