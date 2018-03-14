'use strict'

function buildFastaSequence({ species, sequence }) {
	// `entry` is {species: string, sequence: string}
	return `> ${species}\n${sequence}`
}

module.exports.buildFasta = buildFasta
function buildFasta(data) {
	// `data` is Array<{species: string, sequence: string}>
	return data.map(buildFastaSequence).join('\n')
}
