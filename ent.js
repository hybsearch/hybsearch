#!/usr/bin/env node
'use strict'

require('./vendor/array.proto.includes')
const getData = require('./bin/lib_get-data')
const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')

const ENABLE_DEBUG = false
let debug = console.log.bind(console)

let pluck = (arr, key) => arr.map(x => x[key])
let label = node => `${node.name}-${node.ident}`

function nmMark(node, species1, species2) {
	if (node.branchset) {
		nmMark(node.branchset[0], species1, species2)
		nmMark(node.branchset[1], species1, species2)
	}
	else if (node.name === species1.name) {
		node.nm_inner = node.nm_inner || []
		node.nm_inner.push(species2)
	}
	else if (node.name === species2.name) {
		node.nm_outer = node.nm_outer || []
		node.nm_outer.push(species1)
	}
}

module.exports.search = nmSearch
function nmSearch(node) {
	if (node.name && !node.ident) {
		let splitted = node.name.split('__')
		node.name = splitted[0]
		node.ident = splitted[1]
	}

	let nmInstances = []

	if (node.branchset) {
		// debug('has branchset')
		let combinations = combs(node.branchset, 2)

		let speciesList = []
		for (let speciesSet of combinations) {
			let resultsA = nmSearch(speciesSet[0])
			let speciesListA = resultsA.species
			nmInstances = nmInstances.concat(resultsA.nm)

			let resultsB = nmSearch(speciesSet[1])
			let speciesListB = resultsB.species
			nmInstances = nmInstances.concat(resultsB.nm)

			// debug('speciesListA:', speciesListA, 'speciesListB', speciesListB)

			let speciesBNames = pluck(speciesListB, 'name')
			speciesListA.forEach(species1 => {
				let hasName = speciesBNames.includes(species1.name)
				let notAllEqual = !(speciesBNames.every(n => n === species1))
				// debug(`included: ${hasName}; not all equal: ${notAllEqual}`)

				// species1 is in speciesListB, and not everything in speciesListB is species1
				if (hasName && notAllEqual) {
					// search in speciesListB
					speciesListB.forEach(species2 => {
						if (species2.name !== species1.name) {
							nmMark(node, species1, species2)
							// debug(`nmMark called on ${species1} and ${species2}`)
							console.log(`nonmonophyly: ${label(species1)} / ${label(species2)}`)
							nmInstances.push([species1, species2])
						}
					})

					// and search in speciesListA
					speciesListA.forEach(species3 => {
						if (species3.name !== species1.name) {
							nmMark(node, species1, species3)
							// debug(`nmMark called on ${species1} and ${species3}`)
							console.log(`nonmonophyly: ${label(species1)} / ${label(species3)}`)
							nmInstances.push([species1, species3])
						}
					})
				}
			})

			speciesList = speciesList.concat(speciesListA, speciesListB)
		}

		speciesList = uniqBy(speciesList, 'ident')
		// debug('speciesList', speciesList)
		return {species: speciesList, nm: nmInstances}
	}

	// debug(`no branchset, name: ${node.name}, ident: ${node.ident}`)
	return {species: [node], nm: nmInstances}
}

module.exports.strictSearch = strictSearch
function strictSearch(node) {
	// Remove individuals after being flagged for inner nm, to prevent
	// unnecessary repeated nm findings
	if (node.name && !node.ident) {
		let splitted = node.name.split('__')
		node.name = splitted[0]
		node.ident = splitted[1]
	}

	let nmInstances = []

	if (node.branchset) {
		// debug('has branchset')
		let combinations = combs(node.branchset, 2)

		let speciesList = []
		for (let speciesSet of combinations) {
			let resultsA = strictSearch(speciesSet[1])
			let speciesListA = resultsA.species
			nmInstances = nmInstances.concat(resultsA.nm)

			let resultsB = strictSearch(speciesSet[0])
			let speciesListB = resultsB.species
			nmInstances = nmInstances.concat(resultsB.nm)

			// debug('speciesListA:', speciesListA, 'speciesListB', speciesListB)

			let speciesBNames = pluck(speciesListB, 'name')
			speciesListA.forEach(species1 => {
				let hasName = speciesBNames.includes(species1.name)
				let notAllEqual = !(speciesBNames.every(n => n === species1))
				// debug(`included: ${hasName}; not all equal: ${notAllEqual}`)

				// species1 is in speciesListB, and not everything in speciesListB is species1
				if (hasName && notAllEqual) {
					// species1 is outer
					//search in speciesListA
					let forRemoval = []
					speciesListA.forEach(species3 => {
						if (species3.name !== species1.name) {
							nmMark(node, species1, species3)
							// debug(`nmMark called on ${species1} and ${species3}`)
							console.log(`nonmonophyly: ${label(species1)} / ${label(species3)}`)
							nmInstances.push([species1, species3])
							forRemoval.push(species3.ident)

						}
					})
					remove(speciesListA, n => forRemoval.includes(n.ident))
				}
			})

			let speciesANames = pluck(speciesListA, 'name')
			speciesListB.forEach(species1 => {
				let hasName = speciesANames.includes(species1.name)
				let notAllEqual = !(speciesANames.every(n => n === species1))
				// debug(`included: ${hasName}; not all equal: ${notAllEqual}`)

				// species1 is in speciesListA, and not everything in speciesListA is species1
				if (hasName && notAllEqual) {
					// species1 is outer
					//search in speciesListA
					let forRemoval = []
					speciesListB.forEach(species3 => {
						if (species3.name !== species1.name) {
							nmMark(node, species1, species3)
							// debug(`nmMark called on ${species1} and ${species3}`)
							console.log(`nonmonophyly: ${label(species1)} / ${label(species3)}`)
							nmInstances.push([species1, species3])
							forRemoval.push(species3.ident)

						}
					})
					remove(speciesListB, n => forRemoval.includes(n.ident))
				}
			})


			speciesList = speciesList.concat(speciesListA, speciesListB)
		}

		speciesList = uniqBy(speciesList, 'ident')
		// debug('speciesList', speciesList)
		return {species: speciesList, nm: nmInstances}
	}

	// debug(`no branchset, name: ${node.name}, ident: ${node.ident}`)
	return {species: [node], nm: nmInstances}
}

module.exports.formatData = formatData
function formatData(results) {
	return results.nm.map(pair => pair.map(label))
}


function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node ent.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(d => JSON.parse(d))
		.then(strictSearch)
		.then(formatData)
		.then(console.log.bind(console))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
