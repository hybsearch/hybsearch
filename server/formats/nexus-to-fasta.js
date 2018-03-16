'use strict'

const startsWith = require('lodash/startsWith')

module.exports = convert
function convert(data) {
	let all_sets = []
	let dataset = null
	let in_matrix = false

	for (let line of data.split('\n')) {
		if (startsWith(line, '\tMatrix')) {
			dataset = []
			in_matrix = true
		} else if (startsWith(line, '\t;')) {
			in_matrix = false
			all_sets.push(dataset)
			dataset = null
		} else if (in_matrix) {
			dataset.push(line)
		}
	}

	let fasta = []
	for (let dataset of all_sets) {
		for (let seq of dataset) {
			let [ident, sequence] = seq.split(/\s+/)
			fasta.push('>' + ident)
			fasta.push(sequence)
		}
	}

	return fasta.join('\n')
}
