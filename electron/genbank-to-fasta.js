'use strict'

const uniq = require('lodash/array/uniq')

function removeWhitespace(str) {
  return str
}

function extractInfoFromGenbank(gbFile) {
  return gbFile.split('//\n')
    .filter(entry => entry && entry.trim().length > 0)
    .map(entry => {
      const accession = (/ACCESSION\s*(\S*)/.exec(entry) || [null, null])[1]
      const organism = (/ORGANISM\s+([^\s]+\s+[^\s]+)/.exec(entry) || [null, null])[1]
      const definition = (/DEFINITION([\s\S]*)ACCESSION/.exec(entry) || [null, null])[1]
      const origin = /ORIGIN\s*\n([\s\S]*)/.exec(entry)[1].replace(/[\d\s\n\/]+/gm, '')

      return {
        accession,
        organism,
        definition,
        origin,
      }
    })
}

function genbankToFasta(genbankFile) {
  const data = extractInfoFromGenbank(genbankFile)
  const organism_list = uniq(data.map(o => o.organism))
  console.log(organism_list)

  return data
    .map(e => `> ${e.organism.replace(' ', '_')}-${e.accession}\n${e.origin}\n`)
    .join('\n')
}

module.exports = genbankToFasta
