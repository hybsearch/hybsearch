// @flow
'use strict'

const { parseFasta } = require('./parse')
const { buildFasta } = require('./build')
const flatten = require('lodash/flatten')

/*::
type EntNmPair = {
	ident: string,
	length: number,
	name: string,
}

type EntNonmonophylyResults = {
	nm: Array<[EntNmPair, EntNmPair]>,
	species: any,
}
*/

module.exports = removeFastaIdentifiers
function removeFastaIdentifiers(
	dataString /* : string */,
	identifiers /* :EntNonmonophylyResults */
) {
	let samples = parseFasta(dataString)
	let identifiersToRemove = new Set(
		flatten(identifiers.nm.map(pair => pair.map(node => node.ident)))
	)

	let filtered = samples.filter(
		({ species }) => !identifiersToRemove.has(species)
	)

	return buildFasta(filtered)
}
