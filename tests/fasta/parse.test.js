/* eslint-env jest */
'use strict'

const expect = require('expect')
const { parseFasta } = require('../../server/lib/fasta/parse')

test('handles basic files', () => {
	const actual = parseFasta(`
> Emydura_subglobosa__KC755190
ggaacaataaattatcacctcaaaagacac

> Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagac

> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
`)

	expect(actual).toMatchSnapshot()
})

test('handles multi-line sequences', () => {
	const actual = parseFasta(`
> Emydura_subglobosa__KC755190
ggaacaataaattatcacctcaaaagacac
ggaacaataaattatcacctcaaaagacac
ggaacaataaattatcacctcaaaagacac

> Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagac
ggaacaatcaattattaccccacaaagac
ggaacaatcaattattaccccacaaagac
ggaacaatcaattattaccccacaaagac
ggaacaatcaattattaccccacaaagac
ggaacaatcaattattaccccacaaagac

> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
ggaacaatcaattattaccccacaaagac
ggaacaatcaattattaccccacaaagac
`)

	expect(actual).toMatchSnapshot()
})
