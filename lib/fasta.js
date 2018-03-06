// @ts-check
'use strict'

// helper function: parse fasta file
module.exports.parseFastaIteratively = parseFastaIteratively
function* parseFastaIteratively(data) {
	// encode species name into the id somewhere
	let species = ''
	let seq = ''

	for (let line of data.split('\n')) {
		line = line.trim()

		// skip blank lines
		if (line === '') {
			continue
		}

		if (line.startsWith('>')) {
			if (species) {
				yield { species, seq }
			}

			// reset variables
			species = line.replace(/^>/, '')
			seq = ''
		} else {
			seq += line
		}
	}

	yield { species, sequence: seq }
}

module.exports.parseFasta = parseFasta
function parseFasta(data) {
	return Array.from(parseFastaIteratively(data))
}

function buildFastaSequence({species, sequence}) {
	// `entry` is {species: string, sequence: string}
	return `> ${entry.species}\n${entry.sequence}`
}

module.exports.buildFasta = buildFasta
function buildFasta(data) {
	// `data` is Array<{species: string, sequence: string}>
	return data.map(buildFastaSequence).join('\n')
}
