#!/usr/bin/env node
'use strict'

const expect = require('expect')
const {parseFasta} = require('../../lib/fasta')

function shouldHandleBasicFiles() {
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
}

function shouldHandleMultiLineSequences() {
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

  const expected = [
    { species: 'Emydura_subglobosa__KC755190', sequence: 'ggaacaataaattatcacctcaaaagacacggaacaataaattatcacctcaaaagacacggaacaataaattatcacctcaaaagacac' },
    { species: 'Emydura_victoriae__KC755189', sequence: 'ggaacaatcaattattaccccacaaagacggaacaatcaattattaccccacaaagacggaacaatcaattattaccccacaaagacggaacaatcaattattaccccacaaagacggaacaatcaattattaccccacaaagacggaacaatcaattattaccccacaaagac' },
    { species: 'Emydura_victoriae__KC755188', sequence: 'ggaacaatcaattattaccccacaaggaaggaacaatcaattattaccccacaaagacggaacaatcaattattaccccacaaagac' },
  ]

  expect(actual).toEqual(expected)
}
