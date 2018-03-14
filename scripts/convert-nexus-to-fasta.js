#!/usr/bin/env node
'use strict'

const getData = require('./lib/get-data')
const convert = require('../bin/nexus-to-fasta')

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node convert-nexus-to-fasta.js (<input> | -)')
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
