#!/usr/bin/env node
'use strict'

const getData = require('./bin/lib_get-data')
require('./vendor/array.proto.includes')

const ENABLE_DEBUG = false
let debug = ENABLE_DEBUG && console.log.bind(console) || () => {}

let pluck = (arr, key) => arr.map(x => x[key])
let label = node => `${node.name}-${node.ident}`

function recordnm(species1, species2) {
	console.log(`nonmonophyly: ${label(species1)} / ${label(species2)}`)
}

function marknm(node, species1, species2) {
	if (node.branchset) {
		marknm(node.branchset[0], species1, species2)
		marknm(node.branchset[1], species1, species2)
	} else if (node.name === species1.name) {
		node.nm_inner = node.nm_inner || []
		node.nm_inner.push(species2)
	} else if (node.name === species2.name) {
		node.nm_outer = node.nm_outer || []
		node.nm_outer.push(species1)
	}
}

function mutatenm(node) {
	node.ident = node.name.split('-')[1]
	node.name = node.name.split('-')[0]

	if (node.branchset) {
		debug('has branchset')
		let speciesListA = mutatenm(node.branchset[0])
		let speciesListB = mutatenm(node.branchset[1])

		debug('speciesListA:', speciesListA, 'speciesListB', speciesListB)
		speciesListA.forEach(species1 => {
			let hasName = pluck(speciesListB, 'name').includes(species1.name)
			let allEqual = !(pluck(speciesListB, 'name').every(n => n === species1))
			debug(`included: ${hasName}; all equal: ${allEqual}`)

			if (hasName && allEqual) {
				speciesListB.forEach(species2 => {
					if (species2.name !== species1.name) {
						marknm(node, species1, species2)
						recordnm(species1, species2)
						debug(`marknm called on ${species1} and ${species2}`)
					}
				})

				speciesListA.forEach(species3 => {
					if (species3.name !== species1.name) {
						marknm(node, species1, species3)
						recordnm(species1, species3)
						debug(`marknm called on ${species1} and ${species3}`)
					}
				})
			}
		})
		let speciesList = [].concat(speciesListA, speciesListB)
		debug('speciesList', speciesList)

		return speciesList
	}

	debug(`no branchset, name: ${node.name}, ident: ${node.ident}`)
	return [node]
}



function main() {
	let file = process.argv[2]

	if (!file && file !== '-') {
		console.error('usage: node ent.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(d => JSON.parse(d))
		.then(mutatenm)
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
