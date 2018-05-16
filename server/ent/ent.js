'use strict'

const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')
const isEqual = require('lodash/isEqual')
const { parseFasta } = require('../formats/fasta/parse')
const hammingDistance = require('../hamdis/hamming-distance')
const { removeNodes } = require('../lib/prune-newick')

const ENABLE_DEBUG = false
let debug = ENABLE_DEBUG ? console.log.bind(console) : () => {}

let label = node => `${node.name} (${node.ident})`
const LABEL_DIVIDER = '__'
const makeIdent = speciesEntry =>
	speciesEntry.name + LABEL_DIVIDER + speciesEntry.ident

// This likely doesn't do anything at the time of writing (5/7/2018)
// I can't find any reference to nmInner or nmOuter anywhere else.
function nmMark(node, species1, species2) {
	if (node.branchset) {
		for (let branch of node.branchset) {
			nmMark(branch, species1, species2)
		}
	} else if (node.name === species1.name) {
		node.nmInner = node.nmInner || []
		node.nmInner.push(species2)
	} else if (node.name === species2.name) {
		node.nmOuter = node.nmOuter || []
		node.nmOuter.push(species1)
	}
}

// Given a root node, will make sure all the names are split into `name` and `ident`
function fixTreeNames(node) {
	if (node.branchset) {
		// If it's a not a leaf, keep going
		for (let branch of node.branchset) {
			fixTreeNames(branch)
		}
	} else if (node.name && !node.ident) {
		// If it's a leaf, and has a name, but not ident, split it up!
		let splitted = node.name.split(LABEL_DIVIDER)
		node.name = splitted[0]
		node.ident = splitted[1]
	}
}

module.exports.strictSearch = strictSearch
function strictSearch(rootNode, fasta) {
	fixTreeNames(rootNode)

	let results = recursiveSearch(rootNode)

	// We don't report all the hybrids found as hybrids just yet
	let hybridSpeciesByName = {}
	let totalHybridSpecies = 0
	for (let pair of results.nm) {
		let hybrid = pair[0]
		let speciesName = hybrid.name
		if (hybridSpeciesByName[speciesName] === undefined) {
			hybridSpeciesByName[speciesName] = []
			totalHybridSpecies++
		}
		hybridSpeciesByName[speciesName].push(hybrid)
	}

	let unflag = []
	// For each species found (if at least 2)
	if (totalHybridSpecies > 1) {
		for (let name in hybridSpeciesByName) {
			let hybrids = hybridSpeciesByName[name]
			// remove the flagged hybrids and redo the search.
			let rootNodeCopy = JSON.parse(JSON.stringify(rootNode))
			removeNodes(rootNodeCopy, hybrids.map(h => h.ident))
			let resultsRedo = recursiveSearch(rootNodeCopy)
			//  If what remains is N-1 hybrid species, then that was a true hybrid
			let newSpeciesNames = {}
			let newSpeciesCount = 0
			for (let pair of resultsRedo.nm) {
				let speciesName = pair[0].name
				if (newSpeciesNames[speciesName] === undefined) {
					newSpeciesNames[speciesName] = true
					newSpeciesCount++
				}
			}
			// if less, then that is NOT a true hybrid. Unmark those.
			if (newSpeciesCount < totalHybridSpecies - 1) {
				// This species is a true nonmonophyly!
			} else {
				// Unflag this
				for (let hybrid of hybrids) {
					unflag.push(hybrid.ident)
				}
			}
		}
		remove(results.nm, pair => unflag.indexOf(pair[0].ident) !== -1)
	}

	let allIndividuals = []

	function getAllIndividuals(node) {
		if (!node.branchset) {
			allIndividuals.push(node)
		} else {
			node.branchset.forEach(getAllIndividuals)
		}
	}

	getAllIndividuals(rootNode)
	// Count number of hybrids for each species
	let hybridSpeciesCount = {}
	for (let pair of results.nm) {
		let hybrid = pair[0]
		let speciesName = hybrid.name
		if (hybridSpeciesCount[speciesName] === undefined) {
			hybridSpeciesCount[speciesName] = 0
		}
		hybridSpeciesCount[speciesName]++
	}

	// Count number of individuals in each species
	let totalSpeciesCount = {}
	for (let individual of allIndividuals) {
		let speciesName = individual.name
		if (totalSpeciesCount[speciesName] === undefined) {
			totalSpeciesCount[speciesName] = 0
		}
		totalSpeciesCount[speciesName]++
	}

	for (let speciesName in hybridSpeciesCount) {
		if (hybridSpeciesCount[speciesName] === totalSpeciesCount[speciesName]) {
			// We need to unflag the one that's furthest away from its closest
			let longestDist
			let furthestHybrid
			for (let pair of results.nm) {
				let hybrid = pair[0]
				if (hybrid.name === speciesName) {
					if (longestDist === undefined) {
						longestDist = hybrid.length
					}
					if (hybrid.length >= longestDist) {
						longestDist = hybrid.length
						furthestHybrid = hybrid
					}
				}
			}

			// furthestHybrid should be removed
			remove(results.nm, pair => pair[0].ident === furthestHybrid.ident)
		}
	}

	return results
}

// Given a node, it will return {species:[],nm:[]}
// where `species` is a list of individuals under that node
// and `nm` is a list of flagged hybrids
function recursiveSearch(node, nmInstances = []) {
	if (node.branchset) {
		debug('has branchset')
		let combinations = combs(node.branchset, 2)

		let speciesList = []
		let forRemoval = []
		for (let speciesSet of combinations) {
			// if species is in speciesList: continue
			let resultsA = recursiveSearch(speciesSet[1], nmInstances)
			let speciesListA = resultsA.species

			let resultsB = recursiveSearch(speciesSet[0], nmInstances)
			let speciesListB = resultsB.species

			debug('speciesListA:', speciesListA, 'speciesListB', speciesListB)

			const speciesChecker = otherSpeciesList => species1 => {
				const otherSpeciesNames = otherSpeciesList.map(s => s.name)

				let hasName = otherSpeciesNames.includes(species1.name)
				let notAllEqual = !otherSpeciesNames.every(n => n === species1.name)
				debug(`included: ${hasName}; not all equal: ${notAllEqual}`)

				if (hasName && notAllEqual) {
					otherSpeciesList.forEach(species3 => {
						if (species3.name === species1.name) {
							const pairCheck = pair => isEqual(pair, [species3, species3])
							const count = nmInstances.filter(pairCheck).length

							if (!count) {
								debug(`nmMark called on ${species3} and ${species3}`)
								debug(`nonmonophyly: ${label(species3)} / ${label(species3)}`)

								nmInstances.push([species3, species3])

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
	return nmlist.map(pair => pair.map(label).join(' / ')).join('\n')
}
