'use strict'

// helper function: parse fasta file
function parseFasta(data) {
	let sequences = []

	// encode species name into the id somewhere
	let species = ''
	let id = ''
	let seq = ''
	for (let line of data.split('\n')) {
		if (line.startsWith('>')) {
			if (id) {
				sequences.push({ id, species, seq })
			}

			;[species, id] = line
				.trim()
				.replace(/^>/, '')
				.split('-')
		} else if (line.length) {
			seq += line.trim()
		} else {
			continue
		}
	}

	return sequences
}

module.exports = parseFasta
