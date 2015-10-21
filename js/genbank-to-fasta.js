'use strict'
const fs = require('fs')

function removeWhitespace(str) {
  return str
}

function extractInfoFromGenbank(gbFile) {
  return gbFile.split('//\n')
    .filter(entry => entry && entry.trim().length > 0)
    .map(entry => {
      const accession = (/ACCESSION\s*(\S*)/.exec(entry) || [null, null])[1]
      const binomial = (/ORGANISM\s+([^\s]+\s+[^\s]+)/.exec(entry) || [null, null])[1]
      const definition = (/DEFINITION([\s\S]*)ACCESSION/.exec(entry) || [null, null])[1]
      const sequence = /ORIGIN\s*\n([\s\S]*)/.exec(entry)[1].replace(/[\d\s\n\/]+/gm, '')
      return {
        accession,
        binomial,
        definition,
        sequence,
      }
    })
}

module.exports.extract = extractInfoFromGenbank
module.exports.extractInfoFromGenbank = extractInfoFromGenbank

function genbackToFasta(genbankFile) {
  const data = extractInfoFromGenbank(genbankFile)
  return data.map(e => `> ${e.binomial.replace(' ', '_')}-${e.accession}\n${e.sequence}\n`).join('\n')
}

module.exports.genbackToFasta = genbackToFasta

function convertFiles(inputFile, outputFile) {
  if (!outputFile) {
    outputFile = `${inputFile}.fasta`
  }
  const gbFile = fs.readFileSync(inputFile, {encoding: 'utf-8'})
  const data = genbackToFasta(gbFile)
  fs.writeFileSync(outputFile, data, {encoding: 'utf-8'})
  return outputFile
}

module.exports.convert = convertFiles
module.exports.convertFiles = convertFiles

function main() {
  if (process.argv.length != 4) {
    process.exit(1)
  }
  convertFiles(process.argv[2], process.argv[3])
}

if (require.main === module) {
  main()
}
