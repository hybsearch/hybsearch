'use strict'

const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')
const isEqual = require('lodash/isEqual')
const { parseFastaToMap } = require('../formats/fasta/parse')
const hammingDistance = require('../hamdis/hamming-distance')

const ENABLE_DEBUG = false
let debug = ENABLE_DEBUG ? console.log.bind(console) : () => {}

let label = node => `${node.name} (${node.ident})`
const LABEL_DIVIDER = '__'

function mark(node, species1, species2) {
	if (node.branchset) {
		mark(node.branchset[0], species1, species2)
		mark(node.branchset[1], species1, species2)
	} else if (node.name === species1.name) {
		node.nm_inner = node.nm_inner || []
		node.nm_inner.push(species2)
	} else if (node.name === species2.name) {
		node.nm_outer = node.nm_outer || []
		node.nm_outer.push(species1)
	}
}

module.exports.search = search
function search(tree, fasta) {
	let entResults = searchHelper(tree)

	// Filter out nonmono pairs before returning
	let finalResults = { species: entResults.species, nm: [] }

	// Build a map of species -> sequence
	let sequenceMap = parseFastaToMap(fasta)

	// For each species S marked in an nm pair,
	// - Go through all other pairs with S in them
	// - Find the shortest pair
	// - If that pair is shorter than the current pair including either of them
	// - That is the new shortest pair

	let allSpecies = new Set()
	for (let result of entResults.nm) {
		let [sp1, sp2] = result.pair

		allSpecies.add(sp1.ident)
		allSpecies.add(sp2.ident)
	}

	let shortestPairs = findShortestPairs(allSpecies, entResults.nm, sequenceMap)

	let uniqueHash = findUniqueThings(shortestPairs)

	for (let result of uniqueHash.values()) {
		mark(result.node, result.pair[0], result.pair[1])
		finalResults.nm.push(result.pair)
	}

	return finalResults
}

function findShortestPairs(allSpecies, nonmonophyly, sequenceMap) {
	let shortestPairs = new Map()

	for (let speciesIdent of allSpecies) {
		let {
			result: smallestResult,
			distance: smallestDist,
		} = findSmallestDistance(speciesIdent, nonmonophyly, sequenceMap)

		let [sp1, sp2] = smallestResult.pair
		let id1 = sp1.name + LABEL_DIVIDER + sp1.ident
		let id2 = sp2.name + LABEL_DIVIDER + sp2.ident

		if (
			(!shortestPairs.has(id1) || smallestDist < shortestPairs.get(id1).dist) &&
			(!shortestPairs.has(id2) || smallestDist < shortestPairs.get(id2).dist)
		) {
			shortestPairs.set(id1, { dist: smallestDist, result: smallestResult })
			shortestPairs.set(id2, { dist: smallestDist, result: smallestResult })
		}
	}

	return shortestPairs
}

function findSmallestDistance(speciesIdent, nonmonophyly, sequenceMap) {
	let smallestResult = undefined
	let smallestDist = undefined

	for (let result of nonmonophyly) {
		let [sp1, sp2] = result.pair
		let id1 = sp1.name + LABEL_DIVIDER + sp1.ident
		let id2 = sp2.name + LABEL_DIVIDER + sp2.ident

		if (sp1.ident === speciesIdent || sp2.ident === speciesIdent) {
			let sequence1 = sequenceMap.get(id1)
			let sequence2 = sequenceMap.get(id2)

			let dist = hammingDistance(sequence1, sequence2)

			if (smallestDist === undefined) {
				smallestDist = dist
			}

			if (dist <= smallestDist) {
				smallestDist = dist
				smallestResult = result
			}
		}
	}

	if (!smallestResult) {
		throw new Error('no smallest result found in findSmallestDistance!')
	}

	return { result: smallestResult, distance: smallestDist }
}

function findUniqueThings(shortestPairs) {
	let uniqueHash = new Map()
	let foundSpecies = new Map()

	for (let [key, value] of shortestPairs.entries()) {
		let result = value.result
		let [sp1, sp2] = result.pair
		let id1 = sp1.name + LABEL_DIVIDER + sp1.ident
		let id2 = sp2.name + LABEL_DIVIDER + sp2.ident
		let hash = id1 > id2 ? id1 + id2 : id2 + id1

		let allowed = true

		if (!foundSpecies.has(id1) && !foundSpecies.has(id2)) {
			foundSpecies.set(id1, { dist: shortestPairs.get(key).dist, hash: hash })
			foundSpecies.set(id2, { dist: shortestPairs.get(key).dist, hash: hash })
		} else {
			let dist = shortestPairs.get(key).dist

			if (
				(!foundSpecies.has(id1) || dist < foundSpecies.get(id1).dist) &&
				(!foundSpecies.has(id2) || dist < foundSpecies.get(id2).dist)
			) {
				// We must have added one that shouldn't have been added!
				// Remove anything with either id1 or id2
				if (foundSpecies.has(id1)) {
					uniqueHash.delete(foundSpecies.get(id1).hash)
				}

				if (foundSpecies.has(id2)) {
					uniqueHash.delete(foundSpecies.get(id2).hash)
				}

				foundSpecies.set(id1, { dist: shortestPairs.get(key).dist, hash: hash })
				foundSpecies.set(id2, { dist: shortestPairs.get(key).dist, hash: hash })
			} else {
				allowed = false
			}
		}

		if (allowed && !uniqueHash.has(hash)) {
			uniqueHash.set(hash, result)
		}
	}

	return uniqueHash
}

function searchHelper(node, nmInstances = []) {
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
			let resultsA = searchHelper(speciesSet[1], nmInstances)
			let speciesListA = resultsA.species

			let resultsB = searchHelper(speciesSet[0], nmInstances)
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
								debug(`mark called on ${species1} and ${species3}`)
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
