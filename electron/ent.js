#!/usr/bin/env node
'use strict'

const _ = require('lodash')

function recordnm(species1, species2) {
	console.log(`Nonmonophyly found: ${species1} and ${species2}`)
}

function marknm(node, species1, species2) {
	if (node.branchset) {
		marknm(node.branchset[0], species1, species2)
		marknm(node.branchset[1], species1, species2)
	} else if (node.name === species1) {
		node.nminner = node.nminner || []
		node.nminner.push(species2)
	} else if (node.name === species2) {
		node.nmouter = node.nmouter || []
		node.nmouter.push(species1)
	}
}

function mutatenm(node) {
	// console.log(node)
	if (node.branchset) {
		// console.log("has branchset")
		let speciesA = mutatenm(node.branchset[0])
		let speciesB = mutatenm(node.branchset[1])
		speciesA.forEach(species1 => {
			console.log(speciesB.indexOf(species1), " ", speciesB.every(x => x === species1))
			if ((speciesB.indexOf(species1) > -1) && (speciesB.every(x => x === species1))) {
				speciesB.forEach(species2 => {
					if (species2 !== species1) {
						marknm(node, species1, species2)
						recordnm(species1, species2)
						// console.log("markednm called on ", species1, " and ", species2)
					}
				})
				speciesA.forEach(species3 => {
					if (species3 !== species1) {
						marknm(node, species1, species3)
						recordnm(species1, species3)
						// console.log("markednm called on ", species1, " and ", species3)
					}
				})
			}
		})
		let speciesList = []
		speciesList = speciesList.concat(speciesA, speciesB)
		// console.log(speciesList)

		return speciesList
	}

	// console.log("no branchset")
	return [node.name]
}

function main() {
	if (process.argv.length < 3) {
		console.error('usage: node ent.js <input>')
		process.exit(1)
	}

	let data = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf-8'))

	let ntree = _.cloneDeep(data)

	mutatenm(ntree)

	console.log(JSON.stringify(ntree, null, 2))
}

if (require.main === module) {
	main()
}
