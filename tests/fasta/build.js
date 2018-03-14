#!/usr/bin/env node
'use strict'

const expect = require('expect')
const {buildFasta} = require('../../server/lib/fasta/build')

const actual = buildFasta([
  { species: 'Emydura_subglobosa__KC755190', sequence: 'ggaacaataaattatcacctcaaaagacac' },
  { species: 'Emydura_victoriae__KC755189', sequence: 'ggaacaatcaattattaccccacaaagac' },
  { species: 'Emydura_victoriae__KC755188', sequence: 'ggaacaatcaattattaccccacaaggaa' },
])

const expected = `> Emydura_subglobosa__KC755190
ggaacaataaattatcacctcaaaagacac
> Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagac
> Emydura_victoriae__KC755188
ggaacaatcaattattaccccacaaggaa`

expect(actual).toEqual(expected)
