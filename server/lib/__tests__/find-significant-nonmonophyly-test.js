/* eslint-env jest */

const {
	findSignificantNonmonophyly,
} = require('../find-significant-nonmonophyly')

test('only returns the highlighted sequences', () => {
	let jml = {
		distributions: [],
		probabilities: [],
		results: [
			{
				seq1: 'Emydura victoriae [KC755188]',
				seq2: 'Emydura subglobosa [KC755184]',
				Distance: 0.0996441,
				Probability: 0.971514,
			},
			{
				seq1: 'Emydura tanybaraga [KC755187]',
				seq2: 'Emydura subglobosa [KC755184]',
				Distance: 0.0130486,
				Probability: 0.0214893,
				__highlight: true,
			},
			{
				seq1: 'Emydura tanybaraga [KC755186]',
				seq2: 'Emydura subglobosa [KC755190]',
				Distance: 0.0640569,
				Probability: 0.796602,
			},
			{
				seq1: 'Emydura tanybaraga [KC755186]',
				seq2: 'Emydura subglobosa [KC755185]',
				Distance: 0.0699881,
				Probability: 0.89905,
			},
			{
				seq1: 'Emydura tanybaraga [KC755186]',
				seq2: 'Emydura subglobosa [KC755184]',
				Distance: 0.0154211,
				Probability: 0.023988,
				__highlight: true,
			},
		],
	}

	let ent = {
		nm: [
			{
				name: 'Emydura_subglobosa',
				length: 0.008548827,
				ident: 'KC755184',
			},
		],
		species: [],
	}

	let actual = findSignificantNonmonophyly(jml, ent)

	expect(actual).toHaveLength(2)

	expect(actual).toMatchSnapshot()
})

test('handles more than one case', () => {
	// this test is much the same as 'only returns the highlighted sequences'
	let jml = {
		distributions: [],
		probabilities: [],
		results: [
			{
				seq1: 'Emydura victoriae [KC755188]',
				seq2: 'Emydura subglobosa [KC755184]',
				Distance: 0.0996441,
				Probability: 0.971514,
			},
			{
				seq1: 'Emydura tanybaraga [KC755187]',
				seq2: 'Emydura subglobosa [KC755184]',
				Distance: 0.0130486,
				Probability: 0.0214893,
				__highlight: true,
			},
			{
				seq1: 'Emydura tanybaraga [KC755186]',
				seq2: 'Emydura subglobosa [KC755190]',
				Distance: 0.0640569,
				Probability: 0.796602,
			},
			{
				seq1: 'Emydura tanybaraga [KC755186]',
				seq2: 'Emydura subglobosa [KC755185]',
				Distance: 0.0699881,
				Probability: 0.89905,
			},
			{
				seq1: 'Emydura tanybaraga [KC755186]',
				seq2: 'Emydura subglobosa [KC755184]',
				Distance: 0.0154211,
				Probability: 0.023988,
				__highlight: true,
			},
		],
	}

	let ent = {
		nm: [
			{
				name: 'Emydura_subglobosa',
				length: 0.008548827,
				ident: 'KC755186',
			},
		],
		species: [],
	}

	let actual = findSignificantNonmonophyly(jml, ent)

	expect(actual).toHaveLength(1)

	expect(actual).toMatchSnapshot()
})
