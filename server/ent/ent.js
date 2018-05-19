'use strict'

const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')
const { removeNodes } = require('../lib/prune-newick')

const ENABLE_DEBUG = false
let debug = ENABLE_DEBUG ? console.log.bind(console) : () => {}

let label = node => `${node.name} (${node.ident})`
const LABEL_DIVIDER = '__'

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

module.exports.search = search
function search(rootNode) {
	fixTreeNames(rootNode)

	let results = recursiveSearch(rootNode)
	unflagIfOnlyTwo(results, rootNode) // Mutates the result
	unflagIfRemovingDoesNotFix(results, rootNode) // Also mutates

	return results
}

module.exports.searchWithNoFilter = searchWithNoFilter
function searchWithNoFilter(rootNode) {
	fixTreeNames(rootNode)
	return recursiveSearch(rootNode)
}

// Given a species name and a tree, find the node under which
// all the individuals of this species lie
function getMostRecentCommonAncestor(rootNode, speciesName) {
	let rootCopy = JSON.parse(JSON.stringify(rootNode))
	// Add parent references to each node
	function addParent(node) {
		if (node.branchset) {
			for (let child of node.branchset) {
				child.parent = node
			}
			node.branchset.forEach(addParent)
		}
	}

	addParent(rootCopy)

	let allIndividuals = findIndividualsOfSpecies(rootCopy, speciesName)

	if (allIndividuals.length === 0) {
		throw new Error('Attempt to search for a species that is not in the tree.')
	}

	// Keep going to parent as long as not all the individuals in
	// the species are under this parent
	let individual = allIndividuals[0]
	let leafNodes = findIndividualsOfSpecies(individual, speciesName)
	while (leafNodes.length < allIndividuals.length) {
		individual = individual.parent
		leafNodes = findIndividualsOfSpecies(individual, speciesName)
	}
	return individual
}

// Find just one individual of the species
function findIndividualsOfSpecies(startNode, targetSpeciesName) {
	let allIndividuals = []
	function find(node) {
		if (node.branchset) {
			node.branchset.forEach(find)
		} else {
			if (node.name === targetSpeciesName) {
				allIndividuals.push(node)
			}
		}
	}
	find(startNode)
	return allIndividuals
}

// We only want hybrids that, once removed, make their species monophyletic
// Check if all the flagged ones have this property. Otherwise unflag them
function unflagIfRemovingDoesNotFix(results, rootNode) {
	let hybridSpeciesByName = {}
	let totalHybridSpecies = 0
	for (let hybrid of results.nm) {
		let speciesName = hybrid.name
		if (hybridSpeciesByName[speciesName] === undefined) {
			hybridSpeciesByName[speciesName] = []
			totalHybridSpecies += 1
		}
		hybridSpeciesByName[speciesName].push(hybrid)
	}

	// For each species found (if at least 2)
	if (totalHybridSpecies > 1) {
		let unflag = []
		for (let name in hybridSpeciesByName) {
			let hybrids = hybridSpeciesByName[name]

			// remove the flagged hybrids and check if their species becomes monophyletic
			let rootNodeCopy = JSON.parse(JSON.stringify(rootNode))
			removeNodes(rootNodeCopy, hybrids.map(h => h.ident))

			// Find the MRCA
			let MCRA = getMostRecentCommonAncestor(rootNodeCopy, name)

			// Determine whether everything under that node is of the same species
			let leafNodes = []
			const getLeafNodes = node => {
				if (node.branchset) {
					node.branchset.forEach(getLeafNodes)
				} else {
					leafNodes.push(node)
				}
			}
			getLeafNodes(MCRA)

			let allEqual = leafNodes.every(n => n.name === name)

			// if the species is still nonmono, then we unflag these
			if (!allEqual) {
				for (let hybrid of hybrids) {
					unflag.push(hybrid.ident)
				}
			}
		}
		remove(results.nm, hybrid => unflag.indexOf(hybrid.ident) !== -1)
	}
}

// Check if we've flagged the entire species. If two, keep at least one
function unflagIfOnlyTwo(results, rootNode) {
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
	for (let hybrid of results.nm) {
		let speciesName = hybrid.name
		if (hybridSpeciesCount[speciesName] === undefined) {
			hybridSpeciesCount[speciesName] = 0
		}
		hybridSpeciesCount[speciesName] += 1
	}

	// Count number of individuals in each species
	let totalSpeciesCount = {}
	for (let individual of allIndividuals) {
		let speciesName = individual.name
		if (totalSpeciesCount[speciesName] === undefined) {
			totalSpeciesCount[speciesName] = 0
		}
		totalSpeciesCount[speciesName] += 1
	}

	for (let speciesName in hybridSpeciesCount) {
		if (hybridSpeciesCount[speciesName] === totalSpeciesCount[speciesName]) {
			// We need to unflag the one that's furthest away from its closest
			let longestDist
			let furthestHybrid
			for (let hybrid of results.nm) {
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
			remove(results.nm, hybrid => hybrid.ident === furthestHybrid.ident)
		}
	}
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
							const count = nmInstances.filter(sp => sp === species3).length

							if (!count) {
								debug(`nmMark called on ${species3}`)
								debug(`nonmonophyly: ${label(species3)}`)

								nmInstances.push(species3)

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

			if (speciesListA.length) {
				speciesList.push(...speciesListA)
			}
			if (speciesListB.length) {
				speciesList.push(...speciesListB)
			}
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
	return nmlist.map(label).join('\n')
}
