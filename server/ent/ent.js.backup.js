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
		node.nmInner = node.nmInner || []
		node.nmInner.push(species2)
	} else if (node.name === species2.name) {
		node.nmOuter = node.nmOuter || []
		node.nmOuter.push(species1)
	}
}

module.exports.strictSearch = strictSearch
function strictSearch(node, fasta) {
	let entResults = strictSearchHelper(node)
	// Out of all the nonmonophyletic pairs found, we want to
	// return just the closest pair for each nm individual
	let finalResults = { species: entResults.species, nm: [] }

	const fastaData = parseFasta(fasta)
	// Build a dict map of species -> sequence
	// We'll use this to compute hamming distances 
	let sequenceMap = {}
	for (let obj of fastaData) {
		sequenceMap[obj.species] = obj.sequence
	}


	// 1- Find which column contains the nm individuals 
		// This column will have less unique individuals
	let nmCol = 0;
	let col1Count = 0;
	let col2Count = 0;
	let speciesCheck = {}
	for (let result of entResults.nm) {
		let sp1 = result.pair[0]
		let sp2 = result.pair[1]
		// Unique individual are identified by `ident` 
		// While a species is identified by `name`
		if (!speciesCheck[sp1.ident]) {
			speciesCheck[sp1.ident] = true
			col1Count ++
		}
		if (!speciesCheck[sp2.ident]) {
			speciesCheck[sp2.ident] = true
			col2Count ++
		}
	}
	if(col2Count < col1Count){
		nmCol = 1
	}

	// 2- For each nm individual S marked in an nm pair,
		// Go through all other pairs with S in them
		// Find the pair with the shortest distance
	let otherCol = (nmCol == 0) ? 1 : 0
	let nmIndividualCheck = {}
	let otherIndividualCheck = {}
	finalResults.output = []

	for (let i=0; i < entResults.nm.length; i++) {
		let result = entResults.nm[i]
		let nmIndividual = result.pair[nmCol]
		let otherIndividual = result.pair[otherCol]
		let sequence1 = sequenceMap[makeIdent(nmIndividual)]
		let sequence2 = sequenceMap[makeIdent(otherIndividual)]
		let dist = hammingDistance(sequence1, sequence2)
		let smallestResult = result 

		finalResults.output.push(nmIndividual.ident)
		// Check if we've already got this nm individual 
		if(nmIndividualCheck[nmIndividual.ident] == true){
			continue 
		}

		finalResults.output.push("-----")
		finalResults.output.push("    " + makeIdent(otherIndividual) + "-" + String(dist))

		for (let j=0; j < entResults.nm.length; j++) {
			if(i == j){
				continue
			}
			let result2 = entResults.nm[j]
			let nm2 = result2.pair[nmCol]
			let other2 = result2.pair[otherCol]
			if(nm2.name == nmIndividual.name && !otherIndividualCheck[other2.ident]){
				let sq1 = sequenceMap[makeIdent(nmIndividual)]
				let sq2 = sequenceMap[makeIdent(other2)]
				let dist2 = hammingDistance(sq1, sq2)
				if(dist2 < dist){
					dist = dist2 
					let newPair = []
					newPair[nmCol] = nmIndividual
					newPair[otherCol] = other2
					smallestResult = {pair:newPair,node:result2.node}
				}
				finalResults.output.push("    " + makeIdent(other2) + "-" + String(dist2))

			}
			
		}

		nmIndividualCheck[nmIndividual.ident] = true 
		otherIndividualCheck[smallestResult.pair[otherCol].ident] = true
		finalResults.nm.push(smallestResult.pair)
		nmMark(smallestResult.node, smallestResult.pair[nmCol], smallestResult.pair[otherCol])
	}

	// for (let i=0; i < entResults.nm.length; i++) {
	// 	let result = entResults.nm[i]
	// 	let nmIndividual = result.pair[nmCol]
	// 	let otherIndividual = result.pair[otherCol]

	// 	finalResults.nm.push(result.pair)
	// 	nmMark(result.node,result.pair[0],result.pair[1])
	// }

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
