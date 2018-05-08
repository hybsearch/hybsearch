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

	return recursiveSearch(rootNode)
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
