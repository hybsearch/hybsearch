/* eslint-env jest */

const { highlightSignificantResults } = require('../highlight')

test('highlights results with a p-value of < 0.05', () => {
	let input = [
		{
			seq1: 'Emydura tanybaraga [KC755187]',
			seq2: 'Emydura subglobosa [KC755190]',
			Distance: 0.0616845,
			Probability: 0.753123,
		},
		{
			seq1: 'Emydura tanybaraga [KC755187]',
			seq2: 'Emydura subglobosa [KC755185]',
			Distance: 0.0711744,
			Probability: 0.914043,
		},
		{
			seq1: 'Emydura tanybaraga [KC755187]',
			seq2: 'Emydura subglobosa [KC755184]',
			Distance: 0.0130486,
			Probability: 0.0214893,
		},
		{
			seq1: 'Emydura tanybaraga [KC755186]',
			seq2: 'Emydura subglobosa [KC755184]',
			Distance: 0.0154211,
			Probability: 0.023988,
		},
		{
			seq1: 'Emydura tanybaraga [KC755186]',
			seq2: 'Emydura victoriae [KC755188]',
			Distance: 0.0996441,
			Probability: 0.972514,
		},
		{
			seq1: 'Emydura macquarii [KC755183]',
			seq2: 'Emydura subglobosa [KC755190]',
			Distance: 0.0877817,
			Probability: 0.884558,
		},
		{
			seq1: 'Emydura macquarii [KC755183]',
			seq2: 'Emydura victoriae [KC755189]',
			Distance: 0.0438909,
			Probability: 0.73913,
		},
	]

	let output = input.map(highlightSignificantResults)

	expect(output).toMatchSnapshot()

	// there should be two entries in the input with a __highlight flag
	expect(output.filter(x => x.__highlight)).toHaveLength(2)
})
