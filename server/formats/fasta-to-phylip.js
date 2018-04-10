// @flow
'use strict'

const { parseFasta } = require('./fasta/parse')
const invert = require('lodash/invert')

module.exports = fastaToPhylip
function fastaToPhylip(fastaData, phylipIdentMap) {
	let samples = parseFasta(fastaData)

	let sequenceToHashedIdentMap = invert(phylipIdentMap)

	let phylipSamples = samples.map(({ species, sequence }) => {
		let hashedName = sequenceToHashedIdentMap[species].split('x').join('')
		return `${hashedName.padEnd(10, ' ')}${sequence}`
	})

	let numberOfSequences = samples.length
	let lengthOfSequences = samples[0].sequence.length

	return `${numberOfSequences} ${lengthOfSequences}\n${phylipSamples.join('\n')}\n`
}
