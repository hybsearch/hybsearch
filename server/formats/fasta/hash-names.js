// @flow
'use strict'

const crypto = require('crypto')
let makeHash = str => {
	let hash = crypto.createHash('sha256')
	hash.update(str)
	return hash.digest('hex')
}

const { parseFasta } = require('./parse')

module.exports = hashFastaSequenceNames
function hashFastaSequenceNames(fastaData) {
	let output = Object.create(null)
	let speciesCounter = new Map()
	let fullHashes = new Map()

	let samples = parseFasta(fastaData)

	for (let { species } of samples) {
		let [speciesName] = species.split('__')
		let hashedSpeciesName = makeHash(speciesName).substr(0, 11)

		speciesCounter.set(
			hashedSpeciesName,
			(speciesCounter.get(hashedSpeciesName) || 0) + 1
		)
		fullHashes.set(speciesName, hashedSpeciesName)
	}

	let speciesCounter2 = new Map()
	for (let { species } of samples) {
		let [speciesName] = species.split('__')
		let hashedSpeciesName = fullHashes.get(speciesName)
		let count = speciesCounter.get(hashedSpeciesName)

		let digitLen = count.toString().length
		let newHashedSpeciesNameLength = hashedSpeciesName.length - 1 - digitLen

		let trimmedName = hashedSpeciesName.substr(0, newHashedSpeciesNameLength)
		speciesCounter2.set(
			hashedSpeciesName,
			(speciesCounter2.get(hashedSpeciesName) || 0) + 1
		)

		let currentCount = speciesCounter2
			.get(hashedSpeciesName)
			.toString()
			.padStart(digitLen, '0')
		output[`${trimmedName}x${currentCount}`] = species
	}

	return output
}
