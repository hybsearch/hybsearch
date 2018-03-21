'use strict'

const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')
const isEqual = require('lodash/isEqual')
const { parseFasta } = require('../formats/fasta/parse')
const hammingDistance = require('../hamdis/hamming-distance')

const ENABLE_DEBUG = false
let debug = ENABLE_DEBUG ? console.log.bind(console) : () => {}

let label = node => `${node.name} (${node.ident})`
const LABEL_DIVIDER = '__'
const makeIdent = speciesEntry =>
	speciesEntry.name + LABEL_DIVIDER + speciesEntry.ident

function nmMark(node, species1, species2) {
	if (node.branchset) {
		nmMark(node.branchset[0], species1, species2)
		nmMark(node.branchset[1], species1, species2)
	} else if (node.name === species1.name) {
		node.nm_inner = node.nm_inner || []
		node.nm_inner.push(species2)
	} else if (node.name === species2.name) {
		node.nm_outer = node.nm_outer || []
		node.nm_outer.push(species1)
	}
}

module.exports.strictSearch = strictSearch
function strictSearch(node, fasta) {
	let entResults = strictSearchHelper(node)
	// Filter out nonmono pairs before returning
	let finalResults = { species: entResults.species, nm: [] }

	const fastaData = parseFasta(fasta)
	// Build a dict map of species -> sequence
	let sequenceMap = {}
	for (let obj of fastaData) {
		sequenceMap[obj.species] = obj.sequence
	}

	// For each species S marked in an nm pair,
	// Go through all other pairs with S in them
	// Find the shortest pair
	// If that pair is shorter than the current pair including either of them
	// That is the new shortest pair
	let allSpecies = []
	let speciesCheck = {}

	for (let result of entResults.nm) {
		let sp1 = result.pair[0]
		let sp2 = result.pair[1]

		if (!speciesCheck[sp1.ident]) {
			allSpecies.push(sp1.ident)
			speciesCheck[sp1.ident] = true
		}
		if (!speciesCheck[sp2.ident]) {
			allSpecies.push(sp2.ident)
			speciesCheck[sp2.ident] = true
		}
	}

	let shortestPairs = {}

	for (let speciesIdent of allSpecies) {
		let smallestResult = undefined
		let smallestDist = -1

		for (let result of entResults.nm) {
			let sp1 = result.pair[0]
			let sp2 = result.pair[1]
			let id1 = makeIdent(sp1)
			let id2 = makeIdent(sp2)

			let sequence1 = sequenceMap[id1]
			let sequence2 = sequenceMap[id2]

			if (!sequence1) {
				throw new Error(`ent: sequenceMap does not have an entry for ${id1}`)
			} else if (!sequence2) {
				throw new Error(`ent: sequenceMap does not have an entry for ${id2}`)
			}

			let dist = hammingDistance(sequence1, sequence2)

			if (sp1.ident === speciesIdent || sp2.ident === speciesIdent) {
				if (smallestDist === -1) {
					smallestDist = dist
				}

				if (dist <= smallestDist) {
					smallestDist = dist
					smallestResult = result
				}
			}
		}

		let sp1 = smallestResult.pair[0]
		let sp2 = smallestResult.pair[1]
		let id1 = makeIdent(sp1)
		let id2 = makeIdent(sp2)

		if (
			(!shortestPairs.hasOwnProperty(id1) ||
				smallestDist < shortestPairs[id1].dist) &&
			(!shortestPairs.hasOwnProperty(id2) ||
				smallestDist < shortestPairs[id2].dist)
		) {
			shortestPairs[id1] = { dist: smallestDist, result: smallestResult }
			shortestPairs[id2] = { dist: smallestDist, result: smallestResult }
		}
	}

	let uniqueHash = {}
	let foundSpecies = {}

	for (let key in shortestPairs) {
		let result = shortestPairs[key].result
		let sp1 = result.pair[0]
		let sp2 = result.pair[1]
		let id1 = makeIdent(sp1)
		let id2 = makeIdent(sp2)
		let hash = id1 > id2 ? id1 + id2 : id2 + id1

		let allowed = true

		if (!foundSpecies[id1] && !foundSpecies[id2]) {
			foundSpecies[id1] = { dist: shortestPairs[key].dist, hash: hash }
			foundSpecies[id2] = { dist: shortestPairs[key].dist, hash: hash }
		} else {
			let dist = shortestPairs[key].dist
			if (
				(!foundSpecies[id1] || dist < foundSpecies[id1].dist) &&
				(!foundSpecies[id2] || dist < foundSpecies[id2].dist)
			) {
				// We must have added one that shouldn't have been added! Remove anything with either id1 or id2
				if (foundSpecies[id1]) {
					delete uniqueHash[foundSpecies[id1].hash]
				}
				if (foundSpecies[id2]) {
					delete uniqueHash[foundSpecies[id2].hash]
				}

				foundSpecies[id1] = { dist: shortestPairs[key].dist, hash: hash }
				foundSpecies[id2] = { dist: shortestPairs[key].dist, hash: hash }
			} else {
				allowed = false
			}
		}

		if (!uniqueHash.hasOwnProperty(hash) && allowed) {
			uniqueHash[hash] = result
		}
	}

	for (let hash in uniqueHash) {
		let result = uniqueHash[hash]
		nmMark(result.node, result.pair[0], result.pair[1])
		finalResults.nm.push(result.pair)
	}

	return finalResults
}

function strictSearchHelper(node, nmInstances = []) {
	// Remove individuals after being flagged for inner nm, to prevent
	// unnecessary repeated nm findings
	if (node.name && !node.ident) {
		let splitted = node.name.split(LABEL_DIVIDER)
		node.name = splitted[0]
		node.ident = splitted[1]
	}

	if (node.branchset) {
		debug('has branchset')
		let combinations = combs(node.branchset, 2)

		let speciesList = []
		let forRemoval = []
		for (let speciesSet of combinations) {
			// if species is in speciesList: continue
			let resultsA = strictSearchHelper(speciesSet[1], nmInstances)
			let speciesListA = resultsA.species

			let resultsB = strictSearchHelper(speciesSet[0], nmInstances)
			let speciesListB = resultsB.species

			debug('speciesListA:', speciesListA, 'speciesListB', speciesListB)

			const speciesChecker = otherSpeciesList => species1 => {
				const otherSpeciesNames = otherSpeciesList.map(s => s.name)

				let hasName = otherSpeciesNames.includes(species1.name)
				let notAllEqual = !otherSpeciesNames.every(n => n === species1)
				debug(`included: ${hasName}; not all equal: ${notAllEqual}`)

				// species1 is in speciesList{B,A}, and not everything in speciesList{B,A} is species1
				if (hasName && notAllEqual) {
					// species1 is outer
					// search in otherSpeciesList
					otherSpeciesList.forEach(species3 => {
						if (species3.name !== species1.name) {
							const pairCheck = pair => isEqual(pair.pair, [species1, species3])
							const count = nmInstances.filter(pairCheck).length

							if (!count) {
								debug(`nmMark called on ${species1} and ${species3}`)
								debug(`nonmonophyly: ${label(species1)} / ${label(species3)}`)

								nmInstances.push({ pair: [species1, species3], node: node })

								forRemoval.push(species3.ident)
								debug(`removing from A ${label(species3)}`)
							}
						}
					})
				}
			}

			speciesListA.forEach(speciesChecker(speciesListB))
			remove(speciesListA, n => forRemoval.includes(n.ident))

			speciesListB.forEach(speciesChecker(speciesListA))
			remove(speciesListB, n => forRemoval.includes(n.ident))

			speciesList = [...speciesList, ...speciesListA, ...speciesListB]
		}

		speciesList = uniqBy(speciesList, 'ident')

		debug('speciesList', speciesList)
		return { species: speciesList, nm: nmInstances }
	}

	debug(`no branchset, name: ${node.name}, ident: ${node.ident}`)
	return { species: [node], nm: nmInstances }
}

module.exports.formatData = formatData
function formatData(results) {
	const { nm: nmlist } = results
	// prettier-ignore
	return nmlist
		.map(pair => pair.map(label).join(' / '))
		.join('\n')
}
