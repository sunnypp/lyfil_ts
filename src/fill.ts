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

interface Environment {
  dictionary: Dictionary;
}

type Result = string[];

interface WeightedResult {
  loss: number;
  result: Result;
}

// https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
const idx: ( successors: string[], object: {} ) => any = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

function foundInCache( source: string, constraint: string, environment: Environment ): Boolean {
  // conceptually environment.dictionary[constraint][source];
  return idx( [ 'dictionary', constraint, source ], environment ) ? true : false;
}

function cached( source: SourceString, constraint: ConstraintString, environment: Environment ): any {
  return environment.dictionary[constraint][source];
}

function fill( source: SourceString, constraint: ConstraintString, environment: Environment ): WeightedResult {

  return {
    loss: source.length,
    result: []
  }
}

module.exports = fill;
