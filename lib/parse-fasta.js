// @ts-check
'use strict'

// helper function: parse fasta file
function* parseFasta(data) {
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

	yield { species, seq }
}

module.exports = parseFasta
