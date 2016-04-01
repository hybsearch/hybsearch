#!/usr/bin/env node
'use strict'

const getData = require('./lib_get-data')

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

	return data
		.map(e => `> ${e.organism.replace(' ', '_')}-${e.accession}\n${e.origin}\n`)
		.join('\n')
}

function main() {
	let file = process.argv[2]

	if (!file && file !== '-') {
		console.error('usage: node genbank-to-fasta.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(genbankToFasta)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
