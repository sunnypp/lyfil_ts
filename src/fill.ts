import './types';
import {
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
} from './utils';

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
    result: lossArray(source.length)
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

      if ( isLoopable( constraint, environment ) ) {
        // Instead of skipping, should save all results with loss upper bounded
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
      }
      else {
        main: for ( let vocabLength = source.length; vocabLength > 0; vocabLength-- ) {
          for (
            let startIndex = 0;
            startIndex + vocabLength <= source.length;
            startIndex++
          ) {
            let toneSequence = source.substr(startIndex, vocabLength);
            if ( isFoundInDictionary( toneSequence, constraint, environment ) ) {
              currentResult = {
                loss: source.length - toneSequence.length,
                result: [
                  ...lossArray(startIndex),
                  // losing other options here, consider Result to be string instead of string[]
                  ( environment.pick || optimized )( environment.dictionary[constraint][toneSequence] ).result[0],
                  ...lossArray( source.length - toneSequence.length - startIndex )
                ]
              };
              break main;
            }
          }
        }
      }


      deep_set( [ 'resultCache', constraint, source ], environment, [ currentResult ] );

      return [ environment, currentResult ];
  }
}

export default ziggu;
