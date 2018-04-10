// @flow
'use strict'

const { parseFasta } = require('./fasta/parse')
const invert = require('lodash/invert')

/*::
type HashedToUnhashedIdentifierMap = {[key: string]: string}
*/

module.exports = fastaToPhylip
function fastaToPhylip(
	fastaData /* : string */,
	phylipIdentMap /* : HashedToUnhashedIdentifierMap */
) {
	let samples = parseFasta(fastaData)

	let sequenceToHashedIdentMap = invert(phylipIdentMap)

	let phylipSamples = samples.map(({ species, sequence }) => {
		let hashedName = sequenceToHashedIdentMap[species].split('x').join('')
		return `${hashedName.padEnd(10, ' ')}${sequence}`
	})

	let numberOfSequences = samples.length
	let lengthOfSequences = samples[0].sequence.length
	let stringifiedSeqs = phylipSamples.join('\n')

	return `${numberOfSequences} ${lengthOfSequences}\n${stringifiedSeqs}\n`
}
