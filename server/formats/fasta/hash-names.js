// @flow
'use strict'

const crypto = require('crypto')
let makeHash = str => {
	let hash = crypto.createHash('sha256')
	hash.update(str)
	return hash
		.digest('hex')
		.replace(/0/g, 'g')
		.replace(/1/g, 'h')
		.replace(/2/g, 'i')
		.replace(/3/g, 'j')
		.replace(/4/g, 'k')
		.replace(/5/g, 'l')
		.replace(/6/g, 'm')
		.replace(/7/g, 'n')
		.replace(/8/g, 'o')
		.replace(/9/g, 'p')
}

const { parseFasta } = require('./parse')

module.exports = hashFastaSequenceNames
function hashFastaSequenceNames(fastaData) {
	let output = Object.create(null)
	let speciesTotalCounter = new Map()
	let fullHashes = new Map()

	let samples = parseFasta(fastaData)

	for (let { species: speciesIdentifier } of samples) {
		let [speciesName] = speciesIdentifier.split('__')
		let hashedSpeciesName = makeHash(speciesName).substr(0, 10)

		speciesTotalCounter.set(
			hashedSpeciesName,
			(speciesTotalCounter.get(hashedSpeciesName) || 0) + 1
		)
		fullHashes.set(speciesName, hashedSpeciesName)
	}

	let speciesIncrementerCounter = new Map()
	for (let { species: speciesIdentifier } of samples) {
		let [speciesName] = speciesIdentifier.split('__')
		let hashedSpeciesName = fullHashes.get(speciesName)
		let count = speciesTotalCounter.get(hashedSpeciesName)

		let digitLen = count.toString().length
		let newHashedSpeciesNameLength = hashedSpeciesName.length - 1 - digitLen

		let trimmedName = hashedSpeciesName.substr(0, newHashedSpeciesNameLength)
		speciesIncrementerCounter.set(
			hashedSpeciesName,
			(speciesIncrementerCounter.get(hashedSpeciesName) || 0) + 1
		)

		let currentCount = speciesIncrementerCounter
			.get(hashedSpeciesName)
			.toString()
			.padStart(digitLen, '0')
		output[`${trimmedName}x${currentCount}`] = speciesIdentifier
	}

	return output
}
