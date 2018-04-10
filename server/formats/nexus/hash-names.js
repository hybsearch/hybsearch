'use strict'
const invert = require('lodash/invert')
const escape = require('lodash/escapeRegExp')
const mapKeys = require('lodash/mapKeys')

module.exports = function hashNexusTreeNames(beastTrees, phylipIdentMap) {
	let labelRegex = /taxlabels(\n\s*[^;]*)+\s;/i
	let labels = labelRegex.exec(beastTrees)[1]
	labels = labels
		.split('\n')
		.map(l => l.trim())
		.filter(x => Boolean(x))

	let sequenceToHashedIdentMap = mapKeys(
		invert(phylipIdentMap),
		// remove the accession numbers to get just the species entries
		(v, k) => k.split('__')[0]
	)

	for (let label of labels) {
		let hashedLabel = sequenceToHashedIdentMap[label]
		let speciesLabel = hashedLabel.split('x')[0]
		beastTrees = beastTrees.replace(
			new RegExp(escape(label), 'g'),
			speciesLabel
		)
	}

	return beastTrees
}
