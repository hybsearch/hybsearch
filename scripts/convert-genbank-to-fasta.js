#!/usr/bin/env node
'use strict'

const getData = require('./lib/get-data')
const genbankToFasta = require('../bin/genbank-to-fasta')

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node genbank-to-fasta.js (<input> | -)')
		process.exit(1)
	}

	return getData(file)
		.then(genbankToFasta)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}