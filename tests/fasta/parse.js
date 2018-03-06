#!/usr/bin/env node
'use strict'

const expect = require('expect')
const {parseFasta} = require('../../lib/fasta')

const actual = parseFasta(`
> Emydura_subglobosa__KC755190
ggaacaataaattatcacctcaaaagacac

> Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagac

> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa
`)

const expected = [
  { species: 'Emydura_subglobosa__KC755190', sequence: 'ggaacaataaattatcacctcaaaagacac' },
  { species: 'Emydura_victoriae__KC755189', sequence: 'ggaacaatcaattattaccccacaaagac' },
  { species: 'Emydura_victoriae__KC755188', sequence: 'ggaacaatcaattattaccccacaaggaa' },
]

expect(actual).toEqual(expected)
