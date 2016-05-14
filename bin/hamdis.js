#!/usr/bin/env node
'use strict'


const getData = require('../lib/get-data')
const range = require('lodash/range')
const max = require('lodash/max')
const min = require('lodash/min')
const mean = require('lodash/mean')

function hammingDistance(seq1, seq2) {
	// We want to compare the two individuals to find a Hamming distance
	// between them. That is, how many base pairs differ between the two
	// sequences. To do this, we must compare each base pair, one at a time.

	// Track the number of base pairs that are different.
	let counter = 0

	for (let i = 0; i < seq1.length; i++) {
		// console.log(seq1[i], seq2[i])
		if (seq1[i] !== seq2[i]) {
			counter += 1
		}
	}

	// console.log(counter)

	// returns number of base pairs that differ
	return counter
}

function estimateGenerations(genLength, percentage) {
	let divtime = percentage / 0.02

	// number of generations (used for seqgen parameters)
	let generationCount = divtime * 1000000 / genLength
	return {divtime, generationCount}
}

function parseFasta(data) {
	let sequences = []

	let id = ''
	let seq = ''
	for (let line of data.split('\n')) {
		if (line.startsWith('>')) {
			if (id) {
				sequences.push({id, seq})
			}
			id = line.trim().replace(/^>/, '')
		}
		else if (line.length) {
			seq += line.trim()
		}
		else {
			continue
		}
	}

	return sequences
}


function* paired(list) {
	let prior
	let firstItem = true
	for (let item of list) {
		// make sure to start with two items
		if (firstItem) {
			firstItem = false
			prior = item
			continue
		}
		yield [prior, item]
		prior = item
	}
}


function doThings(file) {
	// The earlier code works for a file of only two individuals, but we wish
	// to generalize this so that it can be used for multiple pairs of
	// individuals and store the appropriate data.

	// Note that for now, we will assume that all sequences in a single file
	// have the same length.

	// load the data
	let data = parseFasta(file)

	// create a vector of every other integer up to len for the loop
	let listOfNumbers = range(1, data.length, 2)

	// store the original names of the sequences
	let originalNames = data.map(individual => individual.id)

	// We create a for loop to cycle through the pairs and compare
	// each one. The loop will record its findings in a list called `out`.
	let out = []

	for (let [a, b] of paired(data)) {
		let taxon1 = a.seq
		let taxon2 = b.seq //.substr(0, taxon1.length)
		// console.log(taxon1)
		// console.log(taxon2)
		out.push(hammingDistance(taxon1, taxon2))
	}

	return {
		avg: mean(out),
		min: min(out),
		max: max(out),
		percent: avgOfRange / data.length,
		data: out,
	}
}


function main() {
	let seqfile1 = process.argv[2]

	// if (!seqfile1) {
	// 	console.error('usage: node hamming-distance-for-pair.js <seqfile> <seqfile>')
	// 	process.exit(1)
	// }

	getData(seqfile1)
		.then(doThings)
		.then(console.log.bind(console))
		// .catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}

