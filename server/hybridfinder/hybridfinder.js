'use strict'

const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')
const isEqual = require('lodash/isEqual')

let label = node => `${node.name} (${node.ident})`
const LABEL_DIVIDER = '__'
const ENABLE_DEBUG = true
let debug = ENABLE_DEBUG ? console.log.bind(console) : () => {}

module.exports.search = search
function search(rootNode){
	fixTreeNames(rootNode) // This mutates the tree 

	return findHybridsHelper(rootNode) // Recursively find hybrids
}

function fixTreeNames(node){
	// Given a root node, will make sure all the names are split into `name` and `ident`
	if (node.branchset) {
		// If it's a not a leaf, keep going
		for(let branch of node.branchset){
			fixTreeNames(branch)
		}
	} else if (node.name && !node.ident) {
		// If it's a leaf, and has a name, but not ident, split it up! 
		let splitted = node.name.split(LABEL_DIVIDER)
		node.name = splitted[0]
		node.ident = splitted[1]
	}
}

let globalNm = {}

function findHybridsHelper(node, hybrids = []) {
	if (node.branchset) {
		debug('has branchset')
		let combinations = combs(node.branchset, 2)

		let speciesList = []
		let forRemoval = []
		for (let speciesSet of combinations) {
			let resultsA = findHybridsHelper(speciesSet[1], hybrids)
			// speciesListA is all unique INDIVIDUALS under branch speciesSet[1]
			let speciesListA = resultsA.species

			let resultsB = findHybridsHelper(speciesSet[0], hybrids)
			// speciesListB is all unique individuals under branch speciesSet[0]
			let speciesListB = resultsB.species

			debug('speciesListA:', speciesListA, 'speciesListB', speciesListB)
			// Collect some species from this list and remove them 
			speciesListA.forEach(speciesChecker(speciesListB, hybrids, forRemoval,speciesListA))
			remove(speciesListA, n => forRemoval.includes(n.ident))

			speciesListB.forEach(speciesChecker(speciesListA, hybrids, forRemoval,speciesListB))
			remove(speciesListB, n => forRemoval.includes(n.ident))

			speciesList = [...speciesList, ...speciesListA, ...speciesListB]
		}

		speciesList = uniqBy(speciesList, 'ident')

		debug('speciesList', speciesList)
		return { species: speciesList, nm: hybrids }
	}

	debug(`no branchset, name: ${node.name}, ident: ${node.ident}`)
	return { species: [node], nm: hybrids }
}

// Basically, the way this function is used, is, at each branching point in the tree
// 	it creates two lists of the individuals in each subtree call these A and B. 
// 	it doesn't matter which one A or B is, because it does the check both ways
//Take an individual in A. If its species is found in B, and not everything in B is of species A
	/// Then we've found nonmonophyly! 
// To get the actual individuals, it is simply all the individuals in B, that are not of species A. 
function speciesChecker(speciesListB, hybrids, forRemoval, speciesListA) {
	// Given a list of B of individuals (speciesListB), apply this function to each individual of list A
  return function (speciesA) {
  	const speciesBNames = speciesListB.map(s => s.name)

	let hasName = speciesBNames.includes(speciesA.name)
	let notAllEqual = !speciesBNames.every(n => n === speciesA.name)
	let speciesAAllEqual = speciesListA.map(s=>s.name).every(n => n === speciesA.name)
	debug(`included: ${hasName}; not all equal: ${notAllEqual}`)

	// speciesA is in speciesListB, and not everything in speciesListB is speciesA
	if (hasName && notAllEqual) {
		console.log("ALL I KNOW",hasName,notAllEqual,speciesA.name,"is nonmono",speciesBNames, speciesA)
		// speciesA is outer
		// search in speciesListB
		speciesListB.forEach(speciesB => {
			if (speciesB.name == speciesA.name) {
				const pairCheck = pair => isEqual(pair.pair, [speciesA, speciesB])
				const count = hybrids.filter(pairCheck).length

				if (!count) {
					debug(`nonmonophyly: ${label(speciesA)} / ${label(speciesB)}`)

					hybrids.push( [speciesB, speciesB])

					forRemoval.push(speciesB.ident)
					debug(`removing from A ${label(speciesB)}`)
				}
			}
		})
	}
  }
}