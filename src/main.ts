var fulfill = require('./fill');

// Google result
// Songwriters: Brendan Graham / Rolf Lovland
// You Raise Me Up lyrics © Peermusic Publishing, Universal Music Publishing Group
const input = `
When I am down, and oh my soul so weary
When troubles come, and my heart burdened be
Then I am still, and wait here in the silence
Until you come and sit awhile with me
You raise me up, so I can stand on mountains
You raise me up, to walk on stormy seas
I am strong, when I am on your shoulders
You raise me up, to more than I can be
`;

var engTones = require('../src/eng_tones.json');
let toneOf = word => engTones[ word.toUpperCase() ];
let dictionaryFactory = words => words.reduce( (p, word) => {
  let tone = word.split(' ').map(toneOf).join('');
  return tone ? { ...p, [tone]: [ ...( p[tone] || [] ), { loss: 0, result: [ word ] } ] } : p;
  // return toneOf(word) ? { ...p, [toneOf(word)]: [ ...( p[toneOf(word)] || [] ), { loss: 0, result: [ word ] } ] } : p;
}, {});

let adjectivesInput = [ 'good', 'nice', 'minimalistic', 'excellent', 'marvellous', 'wonderful', 'quick', 'convenient', 'awesome', 'and' ];
let environment = {
  dictionary: {
    adj: dictionaryFactory(adjectivesInput)
  },
  pick: rs => rs[Math.floor(Math.random()*rs.length)]
}

console.log( adjectivesInput.join("\t") );
console.log( adjectivesInput.map(toneOf).map( opt => opt ? opt: '__' ).join("\t") );

console.log(
  input.split("\n").map(
    sentence => sentence.split(',').map(
      clause =>
        clause.split(' ').map(
          word => toneOf(word)
        ).join(' '),
    ).join(',')
  ).join("\n")
);

console.log(
  input.split("\n").map(
    sentence => sentence.split(',').map(
      clause => fulfill(
        clause.split(' ').map(
          word => toneOf(word)
        ).join(''),
        'adj',
        environment
      )[1].result.join(' ')
    ).join(',')
  ).join("\n")
);

// let god = [ 'God', 'The Lord', 'The Father', 'My Shephard' ];
// let is = [ 'is', 'truly is', 'is always' ];
// let adj = [ 'good', 'faithful', 'patient', 'kind', 'loving', 'forgiving' ];
// let more = [ 'very', 'really', 'always', 'truly' ];
// let add = [ 'and', 'moreover', 'also', 'by the way' ];

// let environment = {
//   dictionary: {
//     god: dictionaryFactory(god),
//     is: dictionaryFactory(is),
//     adj: dictionaryFactory(adj),
//     more: dictionaryFactory(more),
//   },
//   pick: rs => rs[Math.floor(Math.random()*rs.length)]
// }

// console.log(
//   input.split("\n").map(
//     sentence => sentence.split(',').map(
//       clause => fulfill(
//         clause.split(' ').map(
//           word => toneOf(word)
//         ).join(''),
//         'god,is,more,adj|god,is,adj|add,god,is,more,adj|add,god,is,adj|adj,god|add,adj,god|more,adj,god|god',
//         environment
//       )[1].result.join(' ')
//     ).join(',')
//   ).join("\n")
// );
