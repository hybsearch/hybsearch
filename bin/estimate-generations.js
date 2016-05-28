#!/usr/bin/env node
'use strict'

const execa = require('execa')

function estimateGenerationsR(genLength, percentage) {
	let args = ['lib/hamdis.r', 'estimate', genLength, percentage]
	let output = execa.sync('Rscript', args)
	return output.stdout
}

module.exports = estimateGenerations
function estimateGenerations(genLength, percentage) {
	let divtime = percentage / 0.02

	// number of generations (used for seq gen parameters)
	let gen = divtime * 1000000 / genLength
	return [divtime, gen]
}

function main() {
	let method = process.argv[2]
	let genLength = process.argv[3]
	let percentage = process.argv[4]

	if (genLength === undefined || percentage === undefined) {
		console.error('usage: node estimate-generations.js <genLength> <percentage>')
		process.exit(1)
	}

	let [divtime, gen] = estimateGenerations(genLength, percentage)
	console.log("divtime=%d", divtime)
	console.log("gen=%d", gen)
	// let output = estimateGenerationsR(genLength, percentage)
	// console.log(output)
}

if (require.main === module) {
	main()
}
