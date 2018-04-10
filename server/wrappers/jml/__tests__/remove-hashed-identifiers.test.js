/* eslint-env jest */

const revertHashedIdentifiers = require('../revert-hashed-identifiers')

describe('replaces the hashed identifiers with the unhashed ones', () => {
	let mapping = {
		blgcgdgcx1: 'Emydura_subglobosa__KC755190',
		ahjmjgejx1: 'Emydura_victoriae__KC755189',
		ahjmjgejx2: 'Emydura_victoriae__KC755188',
		defdnggjx1: 'Emydura_tanybaraga__KC755187',
		defdnggjx2: 'Emydura_tanybaraga__KC755186',
		blgcgdgcx2: 'Emydura_subglobosa__KC755185',
		blgcgdgcx3: 'Emydura_subglobosa__KC755184',
		gpnkepggx1: 'Emydura_macquarii__KC755183',
		blgcgdgcx4: 'Emydura_subglobosa__NC_026048',
		blgcgdgcx5: 'Emydura_subglobosa__KC692462',
	}

	test('in results', () => {
		let results = `Sp Comparison	seq1	seq2	Distance	Probability
gpnkepgg-blgcgdgc	gpnkepgg1	blgcgdgc1	0.00449985	0.0944528
gpnkepgg-blgcgdgc	gpnkepgg1	blgcgdgc2	0.00474308	0.0944528
gpnkepgg-blgcgdgc	gpnkepgg1	blgcgdgc3	0.00492551	0.0944528
gpnkepgg-ahjmjgej	gpnkepgg1	ahjmjgej1	0.00224992	0.0394803
gpnkepgg-ahjmjgej	gpnkepgg1	ahjmjgej2	0.00218912	0.0394803
gpnkepgg-defdnggj	gpnkepgg1	defdnggj1	0.00529036	0.0784608
gpnkepgg-defdnggj	gpnkepgg1	defdnggj2	0.00529036	0.0784608`
		let probabilities = ''
		let distributions = ''

		let actual = revertHashedIdentifiers({
			phylipMapping: mapping,
			results,
			probabilities,
			distributions,
		})
		expect(actual).toMatchSnapshot()
	})

	test('in distributions', () => {
		let distributions = `ahjmjgej-blgcgdgc	defdnggj-blgcgdgc	defdnggj-ahjmjgej	gpnkepgg-blgcgdgc	gpnkepgg-ahjmjgej	gpnkepgg-defdnggj
0	0	0	0	0	0
0	0	0	0	0	0
0	0	0	0	0	0
0	0	0	0	0	0`
		let results = ''
		let probabilities = ''

		let actual = revertHashedIdentifiers({
			phylipMapping: mapping,
			results,
			probabilities,
			distributions,
		})
		expect(actual).toMatchSnapshot()
	})

	test('in probabilities', () => {
		let probabilities = `Comparison	minDist	Probability
ahjmjgej-blgcgdgc	0.00462147	0.118441
defdnggj-blgcgdgc	0.000304044	0.130935
defdnggj-ahjmjgej	0.00504713	0.102449
gpnkepgg-blgcgdgc	0.00449985	0.0944528
gpnkepgg-ahjmjgej	0.00218912	0.0394803
gpnkepgg-defdnggj	0.00529036	0.0784608`
		let results = ''
		let distributions = ''

		let actual = revertHashedIdentifiers({
			phylipMapping: mapping,
			results,
			probabilities,
			distributions,
		})
		expect(actual).toMatchSnapshot()
	})
})
