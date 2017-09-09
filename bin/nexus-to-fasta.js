#!/usr/bin/env node
'use strict'

const fs = require('fs')
const startsWith = require('lodash/startsWith')
const getData = require('../lib/get-data')

module.exports = convert
function convert(data) {
	let all_sets = []
	let dataset = null
	let in_matrix = false

	for (let line of data.split('\n')) {
	    if (startsWith(line, '\tMatrix')) {
	        dataset = []
	        in_matrix = true
	    }
	    else if (startsWith(line, '\t;')) {
	        in_matrix = false
	        all_sets.push(dataset)
	        dataset = null
	    }

	    else if (in_matrix) {
	        dataset.push(line)
	    }
	}

	let fasta = []
	for (let dataset of all_sets) {
	    for (let seq of dataset) {
	        let [ident, sequence] = seq.split(/\s+/)
	        fasta.push('>' + ident)
	        fasta.push(sequence)
	    }
	}

	return fasta.join('\n')
}

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node nexus-to-fasta.js (<input> | -)')
		process.exit(1)
	}

	return getData(file)
		.then(convert)
		.then(console.log.bind(console))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
