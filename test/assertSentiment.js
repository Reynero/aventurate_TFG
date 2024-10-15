const assert = require("assert");
const {sentiAnalysis} = require("../middleware");


async function testSentimentAnalysis() {
   
    let result = await sentiAnalysis('I love programming!');
    
    
    let expected = [
        {
            label: '5 stars',
            score: 0.99 
        }
    ];
    
    
    assert.strictEqual(result[0].label, expected[0].label, 'Labels do not match');
    assert(result[0].score > 0.8, 'Score is not greater than 0.9');
    
    console.log('All tests passed!');
}

testSentimentAnalysis().catch(err => console.error('Test failed:', err));