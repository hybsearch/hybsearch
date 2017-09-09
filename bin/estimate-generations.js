#!/usr/bin/env node
'use strict'

// [something something] estimate the number of generations for a species from
// some pieces of information about the species
const estimateGenerations = require('../lib/estimate-generations')

function main() {
	let genLength = process.argv[2]
	let percentage = process.argv[3]

	if (genLength === undefined) {
		console.error(
			'usage: node estimate-generations.js <genLength> [percentage]'
		)
		process.exit(1)
	}

	let { divergenceTime, generationCount } = estimateGenerations(
		genLength,
		percentage
	)

	console.log('divtime=%d', divergenceTime)
	console.log('gen=%d', generationCount)
}

if (require.main === module) {
	main()
}
