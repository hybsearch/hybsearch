#!/usr/bin/env node
'use strict'

const getData = require('./lib_get-data')
const newick = require('../vendor/newick').parse

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node fasta-to-nexus.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(newick)
		.then(d => JSON.stringify(d))
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
