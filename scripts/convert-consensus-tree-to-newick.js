#!/usr/bin/env node
'use strict'

const getData = require('./lib/get-data')
const consensusTreeNewick = require('../bin/consensus-newick')

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node consensus-newick.js (<input> | -)')
		process.exit(1)
	}

	return getData(file)
		.then(consensusTreeNewick)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
