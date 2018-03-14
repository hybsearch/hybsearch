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
				yield { species, sequence: seq }
			}

			// reset variables
			species = line.replace(/^> */, '')
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
