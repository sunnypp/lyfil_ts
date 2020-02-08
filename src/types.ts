const LOOPABLE = Symbol.for('LOOPABLE');
const EMPTY_MARKER = '';

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


