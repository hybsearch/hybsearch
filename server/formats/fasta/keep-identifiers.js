// @flow
'use strict'

const { parseFasta } = require('./parse')
const { buildFasta } = require('./build')
const flatten = require('lodash/flatten')

/*::
type EntNmNode = {
	ident: string,
	length: number,
	name: string,
}

type EntNonmonophylyResults = {
	nm: Array<EntNmNode>,
	species: any,
}
*/

module.exports = keepFastaIdentifiers
function keepFastaIdentifiers(
	dataString /* : string */,
	identifiers /* :EntNonmonophylyResults */
) {
	let samples = parseFasta(dataString)
	let identifiersToRemove = new Set(
		flatten(identifiers.nm.map(hybrid => `${hybrid.name}__${hybrid.ident}`))
	)

	let filtered = samples.filter(({ species }) =>
		identifiersToRemove.has(species)
	)

	return buildFasta(filtered)
}
