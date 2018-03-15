#!/usr/bin/env node
'use strict'

const getData = require('./lib/get-data')
const seqmagick = require('../bin/fasta-to-nexus')

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node fasta-to-nexus.js (<input> | -)')
		process.exit(1)
	}

	return getData(file)
		.then(seqmagick)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
