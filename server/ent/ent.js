'use strict'

const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')
const isEqual = require('lodash/isEqual')
const {parseFasta} = require('../formats/fasta/parse')
const hammingDistance = require('../hamdis/hamming-distance')

const ENABLE_DEBUG = false
let debug = ENABLE_DEBUG ? console.log.bind(console) : () => {}

let label = node => `${node.name} (${node.ident})`
const LABEL_DIVIDER = '__'

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

module.exports.search = nmSearch
function nmSearch(node) {
	if (node.name && !node.ident) {
		let splitted = node.name.split(LABEL_DIVIDER)
		node.name = splitted[0]
		node.ident = splitted[1]
	}

	let nmInstances = []

	if (node.branchset) {
		debug('has branchset')
		let combinations = combs(node.branchset, 2)

		let speciesList = []
		for (let speciesSet of combinations) {
			let resultsA = nmSearch(speciesSet[0])
			let speciesListA = resultsA.species
			nmInstances = nmInstances.concat(resultsA.nm)

			let resultsB = nmSearch(speciesSet[1])
			let speciesListB = resultsB.species
			nmInstances = nmInstances.concat(resultsB.nm)

			debug('speciesListA:', speciesListA, 'speciesListB', speciesListB)

			let speciesBNames = speciesListB.map(s => s.name)
			speciesListA.forEach(species1 => {
				let hasName = speciesBNames.includes(species1.name)
				let notAllEqual = !speciesBNames.every(n => n === species1)
				debug(`included: ${hasName}; not all equal: ${notAllEqual}`)

				// species1 is in speciesListB, and not everything in speciesListB is species1
				if (hasName && notAllEqual) {
					const checkAndMark = otherSpecies => {
						if (otherSpecies.name !== species1.name) {
							nmMark(node, species1, otherSpecies)
							debug(`nmMark called on ${species1} and ${otherSpecies}`)
							console.log(
								`nonmonophyly: ${label(species1)} / ${label(otherSpecies)}`
							)
							nmInstances.push([species1, otherSpecies])
						}
					}

					// search in speciesListB
					speciesListB.forEach(checkAndMark)

					// and search in speciesListA
					speciesListA.forEach(checkAndMark)
				}
			})

			speciesList = [...speciesList, ...speciesListA, ...speciesListB]
		}

		speciesList = uniqBy(speciesList, 'ident')
		debug('speciesList', speciesList)
		return { species: speciesList, nm: nmInstances }
	}

	debug(`no branchset, name: ${node.name}, ident: ${node.ident}`)
	return { species: [node], nm: nmInstances }
}

module.exports.strictSearch = strictSearch
function strictSearch(node, fasta) {
	let entResults = strictSearchHelper(node)
	// Filter out nonmono pairs before returning 
	let finalResults = {species:entResults.species,nm:[]}

	const fastaData = parseFasta(fasta)
	// Build a dict map of species -> sequence 
	let sequenceMap = {}
	for(let obj of fastaData){
		sequenceMap[obj.species] = obj.sequence
	}

	// For each nm pair, we only want to include the smallest one 
	let distMap = {}

	for (let result of entResults.nm) {
		let sp1 = result.pair[0]
		let sp2 = result.pair[1]
		let id1 = sp1.name + LABEL_DIVIDER + sp1.ident
		let id2 = sp2.name + LABEL_DIVIDER + sp2.ident

		let sequence1 = sequenceMap[id1]
		let sequence2 = sequenceMap[id2]

		let dist = hammingDistance(sequence1,sequence2)
		// If it's the first one we've found, include it
		if(distMap[id1] == undefined){
			distMap[id1] = {dist:dist, result: result}
		}
		// If it's smaller than the smallest one so far, replace it 
		if(distMap[id1].dist > dist){
			distMap[id1] = {dist:dist, result: result}
		}
	}

	// Now these are the ones that are okay to include 
	for(let key in distMap){
		let result = distMap[key].result
		nmMark(result.node,result.pair[0],result.pair[1])
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

								nmInstances.push({pair:[species1, species3],node:node})

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
