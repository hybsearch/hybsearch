'use strict'

const startsWith = require('lodash/startsWith')

module.exports = convert
function convert(data) {
	let allSets = []
	let dataset = null
	let inMatrix = false

	for (let line of data.split('\n')) {
		if (startsWith(line, '\tMatrix')) {
			dataset = []
			inMatrix = true
		} else if (startsWith(line, '\t;')) {
			inMatrix = false
			allSets.push(dataset)
			dataset = null
		} else if (inMatrix) {
			dataset.push(line)
		}
	}

	let fasta = []
	for (let dataset of allSets) {
		for (let seq of dataset) {
			let [ident, sequence] = seq.split(/\s+/)
			fasta.push('>' + ident)
			fasta.push(sequence)
		}
	}

	return fasta.join('\n')
}
