const combs = require('combinations-generator')
const uniqBy = require('lodash/uniqBy')
const remove = require('lodash/remove')
const isEqual = require('lodash/isEqual')

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
function strictSearch(node, nmInstances = [], globalNmList = []) {
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
			let resultsA = strictSearch(speciesSet[1], nmInstances, globalNmList)
			let speciesListA = resultsA.species

			let resultsB = strictSearch(speciesSet[0], nmInstances, globalNmList)
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
							const pairCheck = pair => isEqual(pair, [species1, species3])
							const count = nmInstances.filter(pairCheck).length

							if (!count) {
								nmMark(node, species1, species3)

								debug(`nmMark called on ${species1} and ${species3}`)
								debug(`nonmonophyly: ${label(species1)} / ${label(species3)}`)

								nmInstances.push([species1, species3])

								if (!globalNmList.some(pairCheck)) {
									globalNmList.push([species1, species3])
								}

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
