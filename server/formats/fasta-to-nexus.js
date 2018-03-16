'use strict'

const seqmagick = require('../wrappers/seqmagick')

module.exports = fastaToNexus
function fastaToNexus(data) {
	return seqmagick({
		data,
		inputFormat: 'fasta',
		outputFormat: 'nexus',
		alphabet: 'dna',
		removeQuotes: true,
	})
}
