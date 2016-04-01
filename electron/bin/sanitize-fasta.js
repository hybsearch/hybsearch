#!/usr/bin/env node
'use strict'

const getData = require('./lib_get-data')

/*
>gi|723585892|dbj|AB904729.1| Pelodiscus sinensis mitochondrial cytb gene for cytochrome b, partial cds, haplotype: S-6
CCTACGAAAAACCCACCCAATAATTAAAATCATTAACAACTCACTAATTGACCTACCAAGTCCATCCAAC
ATTTCCATTTGATGAAACTTTGGATCATTATTAGGAGCCTGCTTAATACTACAAATCATCACAGGCCTAT
TCCTAGCCATACATTACTCACCAAACATCTCAACAGCATTCTCGTCAATCGCCCACATTACCCGAGATGT
*/

function extractInfoFromFasta(fastaFile) {
	return fastaFile.split('>')
		.filter(entry => entry && entry.trim().length > 0)
		.map(entry => {
			const accession = (/gi\|([0-9]*)/.exec(entry) || [null, null])[1]
			const organism = (/\s* (UNVERIFIED: )?(\S+( \S+)?)/.exec(entry) || [null, null])[2]
			const origin = /[^\n]*\n([\s\S]*)/.exec(entry)[1].replace(/[\d\s\n\/]+/gm, '')

			return {
				accession,
				organism,
				origin
			}
		})
}

module.exports = sanitizeFasta
function sanitizeFasta(fastaFile) {
	const data = extractInfoFromFasta(fastaFile)

	return data
		.map(e => `> ${e.organism.replace(' ', '_')}-${e.accession}\n${e.origin}\n`)
		.join('\n')
}

function main() {
	let file = process.argv[2]

	if (!file && file !== '-') {
		console.error('usage: node sanitize-fasta.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(sanitizeFasta)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
