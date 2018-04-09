// @flow
'use strict'

const {parseFasta} = require('./fasta/parse')
const invert = require('lodash/invert')

module.exports = fastaToPhylip
function fastaToPhylip(fastaData, phylipIdentMap) {
	let samples = parseFasta(fastaData)

	let sequenceToHashedIdentMap = invert(phylipIdentMap)

	let phylipSamples = samples.map(({species, sequence}) => {
		let hashedName = sequenceToHashedIdentMap[species]
		return `${hashedName.padEnd(12, ' ')}${sequence}`
	})

	let numberOfSequences = samples.length
	let lengthOfSequences = samples[0].length

	let output = `${numberOfSequences} ${lengthOfSequences}
${phylipSamples.join('\n')}
`

	return output
}
