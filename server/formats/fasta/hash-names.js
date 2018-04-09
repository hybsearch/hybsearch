// @flow
'use strict'

const crypto = require('crypto')
let makeHash = str => {
	let hash = crypto.createHash('sha256')
	hash.update(str)
	return hash.digest('base64')
}

const {parseFastaIteratively} = require('./parse')

module.exports = hashFastaSequenceNames
function hashFastaSequenceNames(fastaData) {
	let output = Object.create(null)
	let speciesCounter = new Map()

	for (let {species} of parseFastaIteratively(fastaData)) {
		let [speciesName] = species.split('__')
		let hashedSpeciesName = makeHash(speciesName).substr(0, 7)
		let currentCount = speciesCounter.set((speciesCounter.get(hashedSpeciesName) || 0) + 1)
		output[`${hashedSpeciesName}${currentCount}`] = species
	}

	return output
}
