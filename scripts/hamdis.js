#!/usr/bin/env node
'use strict'

const getData = require('./lib/get-data')
const hamdis = require('../server/lib/hamdis')
const estimateGenerations = require('../server/lib/estimate-generations')

function main() {
	return getData(process.argv[2])
		.then(data => {
			let stats = hamdis(data)
			console.log('distances', stats.data)
			console.log('minimum hamming distance:', stats.min)
			console.log('maximum hamming distance:', stats.max)
			console.log('average hamming distance:', stats.avg)
			console.log('percent:', stats.percentDifferent)
			let genCount = estimateGenerations(stats.percentDifferent)
			console.log('divtime:', genCount.divergenceTime)
			console.log('generation count:', genCount.generationCount)
		})
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
