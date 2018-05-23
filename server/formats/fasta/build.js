'use strict'

const wrap = require('word-wrap')

function buildFastaSequence({ species, sequence }) {
	// `entry` is {species: string, sequence: string}
	sequence = wrap(sequence, { cut: true, width: 80, trim: true, indent: '' })
	return `> ${species}\n${sequence}`
}

module.exports.buildFasta = buildFasta
function buildFasta(data) {
	// `data` is Array<{species: string, sequence: string}>
	return data.map(buildFastaSequence).join('\n')
}
