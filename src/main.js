require('./fill');
fill('12321', 'a', {
    dictionary: { a: {
            '1': [{ loss: 0, result: ['9'] }],
            '12': [{ loss: 0, result: ['98'] }],
            '23': [{ loss: 2, result: ['87'] }],
            '21': [{ loss: 0, result: ['89'] }]
        } },
    // beware of the type WeightedResult.  result has to be string[]
    accumulate: function (h, t) { return ({
        loss: h.loss + t.loss,
        result: [(h.result[0] || '0') + (t.result[0] || '0')]
    }); }
});
