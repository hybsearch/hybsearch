#!/usr/bin/env node
'use strict'

const getData = require('./lib/get-data')
const {strictSearch, formatData} = require('../server/lib/ent')

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node ent.js (<input> | -)')
		process.exit(1)
	}

	return getData(file)
		.then(d => JSON.parse(d))
		.then(strictSearch)
		.then(formatData)
		.then(console.log.bind(console))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
