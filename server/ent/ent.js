'use strict'

const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')
const countBy = require('lodash/countBy')
const maxBy = require('lodash/maxBy')
const groupBy = require('lodash/groupBy')
const { removeNodes } = require('../lib/prune-newick')

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
	addParents(rootCopy)

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

function addParents(rootNode) {
	// Add parent references to each node
	function recurse(node) {
		if (node.branchset) {
			for (let child of node.branchset) {
				child.parent = node
			}
			node.branchset.forEach(recurse)
		}
	}

	recurse(rootNode)
}

// Find just one individual of the species
function findIndividualsOfSpecies(startNode, targetSpeciesName) {
	return getLeaves(startNode).filter(node => node.name === targetSpeciesName)
}

// We only want hybrids that, once removed, make their species monophyletic
// Check if all the flagged ones have this property. Otherwise unflag them
function unflagIfRemovingDoesNotFix(results, rootNode) {
	let hybridSpeciesByName = groupBy(results.nm, hybrid => hybrid.name)
	let totalHybridSpecies = Object.keys(hybridSpeciesByName).length

	// For each species found (if at least 2)
	if (totalHybridSpecies < 2) {
		return
	}

	let unflag = []
	for (let [name, hybrids] of Object.entries(hybridSpeciesByName)) {
		// remove the flagged hybrids and check if their species becomes monophyletic
		let rootNodeCopy = JSON.parse(JSON.stringify(rootNode))
		removeNodes(rootNodeCopy, hybrids.map(h => h.ident))

		// Find the MRCA
		let mCRA = getMostRecentCommonAncestor(rootNodeCopy, name)

		// Determine whether everything under that node is of the same species
		let leafNodes = getLeaves(mCRA)

		let allEqual = leafNodes.every(n => n.name === name)

		// if the species is still nonmono, then we unflag these
		if (!allEqual) {
			for (let hybrid of hybrids) {
				unflag.push(hybrid.ident)
			}
		}
	}

	remove(results.nm, hybrid => unflag.includes(hybrid.ident))
}

function getLeaves(root) {
	let leafNodes = []

	const recurse = node => {
		if (node.branchset) {
			node.branchset.forEach(recurse)
		} else {
			leafNodes.push(node)
		}
	}
	recurse(root)

	return leafNodes
}

// Check if we've flagged the entire species. If two, keep at least one
function unflagIfOnlyTwo(results, rootNode) {
	let allIndividuals = getLeaves(rootNode)

	// Count number of hybrids for each species
	let hybridSpeciesCount = countBy(results.nm, hybrid => hybrid.name)

	// Count number of individuals in each species
	let totalSpeciesCount = countBy(allIndividuals, ind => ind.name)

	for (let speciesName of Object.keys(hybridSpeciesCount)) {
		if (hybridSpeciesCount[speciesName] !== totalSpeciesCount[speciesName]) {
			continue
		}

		// We need to unflag the one that's furthest away from its closest
		let applicableSpecies = results.nm.filter(
			hybrid => hybrid.name === speciesName
		)
		let furthestHybrid = maxBy(applicableSpecies, hybrid => hybrid.length)

		// furthestHybrid should be removed
		remove(results.nm, hybrid => hybrid.ident === furthestHybrid.ident)
	}
}

// Given a node, it will return {species:[],nm:[]}
// where `species` is a list of individuals under that node
// and `nm` is a list of flagged hybrids
function recursiveSearch(node, nmInstances = []) {
	if (!node.branchset) {
		return { species: [node], nm: nmInstances }
	}

	let combinations = combs(node.branchset, 2)

	let speciesList = []
	let forRemoval = []
	for (let speciesSet of combinations) {
		// if species is in speciesList: continue
		let resultsA = recursiveSearch(speciesSet[1], nmInstances)
		let speciesListA = resultsA.species

		let resultsB = recursiveSearch(speciesSet[0], nmInstances)
		let speciesListB = resultsB.species

		const speciesChecker = otherSpeciesList => species1 => {
			const otherSpeciesNames = otherSpeciesList.map(s => s.name)

			let hasName = otherSpeciesNames.includes(species1.name)
			let notAllEqual = !otherSpeciesNames.every(n => n === species1.name)

			if (hasName && notAllEqual) {
				otherSpeciesList
					.filter(species3 => species3.name === species1.name)
					.filter(
						species3 => nmInstances.filter(sp => sp === species3).length === 0
					)
					.forEach(species3 => {
						nmInstances.push(species3)
						forRemoval.push(species3.ident)
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

	speciesList = uniqBy(speciesList, sp => sp.ident)

	return { species: speciesList, nm: nmInstances }
}

module.exports.formatData = formatData
function formatData(results) {
	const { nm: nmlist } = results
	return nmlist.map(label).join('\n')
}
