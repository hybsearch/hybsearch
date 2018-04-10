'use strict'
const invert = require('lodash/invert')
const escape = require('regexp.escape')

module.exports.hashNexusTreeNames = function hashNexusTreeNames(
	beastTrees,
	phylipIdentMap
) {
	let labelRegex = /taxlabels(\n\s*[^;]*)+\s;/i
	let labels = labelRegex.exec(beastTrees)[1]
	labels = labels
		.split('\n')
		.map(l => l.trim())
		.filter(x => Boolean(x))

	let sequenceToHashedIdentMap = invert(phylipIdentMap)

	for (let label of labels) {
		let hashedLabel = sequenceToHashedIdentMap[label]
		// console.log(label, hashedLabel, escape(hashedLabel))
		beastTrees = beastTrees.replace(new RegExp(escape(label), 'g'), hashedLabel)
	}

	return beastTrees
}
