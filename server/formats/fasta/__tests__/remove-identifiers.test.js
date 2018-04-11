/* eslint-env jest */
'use strict'

const expect = require('expect')
const removeIdentifiers = require('../remove-identifiers')

test('removes the given identifiers from the data', () => {
	let input = `> Emydura_subglobosa__KC755190
ggaacaataaattatcacctcaaaagacac
> Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagac
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa`

	let filteredSequences = removeIdentifiers(input, {
		nm: [
			[
				{ ident: 'Emydura_subglobosa__KC755190' },
				{ ident: 'Emydura_victoriae__KC755189' },
			],
		],
	})

	expect(filteredSequences).toMatchSnapshot()
})
