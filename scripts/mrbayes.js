#!/usr/bin/env node
// @ts-check
'use strict'

const getData = require('../lib/get-data')
const mrbayes = require('../bin/mrbayes')

function main() {
	let argv = process.argv.slice(2)
	let file = argv[0]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node mrbayes.js (<input> | -) [--quiet]')
		process.exit(1)
	}

	return getData(file)
		.then(data => mrbayes(data, argv))
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
