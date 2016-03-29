#!/usr/bin/env node
'use strict'

const fs = require('fs')
const fromPairs = require('lodash/fromPairs')

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
				origin
			}
		})
}

module.exports = genbankToFasta
function genbankToFasta(genbankFile) {
	const data = extractInfoFromGenbank(genbankFile)
	const organismList = fromPairs(data.map(o => [o.accession, o.organism]))
	console.error(organismList)

	return data
		// .map(e => `> ${e.organism.replace(' ', '_')}-${e.accession}\n${e.origin}\n`)
		.map(e => `> ${e.accession}\n${e.origin}\n`)
		.join('\n')
}

function main() {
	if (process.argv.length < 3) {
		console.error('usage: node genbank-to-fasta.js <input>')
		process.exit(1)
	}

	console.log(genbankToFasta(fs.readFileSync(process.argv[2], 'utf-8')))
}

if (require.main === module) {
	main()
}
