// @flow
'use strict'

const { parseFasta } = require('./parse')
const { buildFasta } = require('./build')

module.exports = removeFastaIdentifiers
function removeFastaIdentifiers(
	dataString /* : string */,
	identifiers /* : Array<string> */
) {
	let samples = parseFasta(dataString)
	let identifiersToRemove = new Set(identifiers)

	let filtered = samples.filter(
		({ species }) => !identifiersToRemove.has(species)
	)

	return buildFasta(filtered)
}
