'use strict'

// helper function: parse fasta file
function parseFasta(data) {
	let sequences = []

	let id = ''
	let seq = ''
	for (let line of data.split('\n')) {
		if (line.startsWith('>')) {
			if (id) {
				sequences.push({id, seq})
			}
			id = line.trim().replace(/^>/, '')
		}
		else if (line.length) {
			seq += line.trim()
		}
		else {
			continue
		}
	}

	return sequences
}

module.exports = parseFasta
