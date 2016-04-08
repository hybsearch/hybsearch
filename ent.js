#!/usr/bin/env node
'use strict'

const getData = require('./bin/lib_get-data')
require('./vendor/array.proto.includes')

const ENABLE_DEBUG = false
const equals = rhs => lhs => lhs === rhs
const debug = ENABLE_DEBUG && console.log.bind(console) || () => {}

function recordnm(species1, species2) {
	console.log(`nonmonophyly: ${species1} / ${species2}`)
}

function marknm(node, species1, species2) {
	if (node.branchset) {
		marknm(node.branchset[0], species1, species2)
		marknm(node.branchset[1], species1, species2)
	} else if (node.name === species1) {
		node.nm_inner = node.nm_inner || []
		node.nm_inner.push(species2)
	} else if (node.name === species2) {
		node.nm_outer = node.nm_outer || []
		node.nm_outer.push(species1)
	}
}

function getName(name) {
	return name.split('-')[0]
}

function mutatenm(node) {
	node.ident = node.name.split('-')[1]
	node.name = node.name.split('-')[0]

	if (node.branchset) {
		debug("has branchset")
		let speciesA = mutatenm(node.branchset[0]).map(getName)
		let speciesB = mutatenm(node.branchset[1]).map(getName)

		debug('speciesA:', speciesA, 'speciesB', speciesB)
		speciesA.forEach(species1 => {
			debug(`included: ${speciesB.includes(species1)}; all equal: ${speciesB.every(equals(species1))}`)
			if (speciesB.includes(species1) && !speciesB.every(equals(species1))) {
				speciesB.forEach(species2 => {
					if (species2 !== species1) {
						marknm(node, species1, species2)
						recordnm(species1, species2)
						debug("marknm called on ", species1, " and ", species2)
					}
				})

				speciesA.forEach(species3 => {
					if (species3 !== species1) {
						marknm(node, species1, species3)
						recordnm(species1, species3)
						debug("marknm called on ", species1, " and ", species3)
					}
				})
			}
		})
		let speciesList = [].concat(speciesA, speciesB)
		debug('speciesList', speciesList)

		return speciesList
	}

	debug(`no branchset, name: ${node.name}, ident: ${node.ident}`)
	return [node.name]
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
