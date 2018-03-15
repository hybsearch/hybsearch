#!/usr/bin/env node
'use strict'

const getData = require('./lib/get-data')
const newick = require('../lib/newick').parse

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node convert-newick-tree-to-json.js (<input> | -)')
		process.exit(1)
	}

	return getData(file)
		.then(newick)
		.then(d => JSON.stringify(d))
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
