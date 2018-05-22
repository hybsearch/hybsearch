/* eslint-env jest */
'use strict'

const expect = require('expect')
const hashNames = require('../hash-names')

test('shortens the accession identifiers', () => {
	let input = `> Emydura_subglobosa__KC755190
ggaacaataaattatcacctcaaaagacac
> Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagac
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa`

	let hashedNames = hashNames(input)

	expect(hashedNames).toMatchSnapshot()
})

test('does not pad accession numbers to the left with 0s when they grow past one digit', () => {
	let input = `> Emydura_victoriae__KC755189
ggaacaataaattatcacctcaaaagacac
> Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagac
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa`

	let hashedNames = hashNames(input)

	for (let key of Object.keys(hashNames)) {
		expect(key).toMatch(/ahjmjgex[1-9][0-9]*/)
	}

	expect(hashedNames).toMatchSnapshot()
})
