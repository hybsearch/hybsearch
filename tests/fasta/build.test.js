/* eslint-env jest */
'use strict'

const expect = require('expect')
const { buildFasta } = require('../../server/lib/fasta/build')

describe('fasta/build', () => {
	it('should generate a fasta file from a fasta object', () => {
		const actual = buildFasta([
			{
				species: 'Emydura_subglobosa__KC755190',
				sequence: 'ggaacaataaattatcacctcaaaagacac',
			},
			{
				species: 'Emydura_victoriae__KC755189',
				sequence: 'ggaacaatcaattattaccccacaaagac',
			},
			{
				species: 'Emydura_victoriae__KC755188',
				sequence: 'ggaacaatcaattattaccccacaaggaa',
			},
		])

		expect(actual).toMatchSnapshot()
	})
})
