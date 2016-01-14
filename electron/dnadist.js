'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const _ = require('lodash')

function dnadist(data) {
	const inputFile = './infile'
	const outputFile = './outfile'
	fs.writeFileSync(inputFile, data, 'utf-8')

	// let commands = [
	// 	'D',
	// 	'D',
	// 	'Y',
	// ].join('\n')
	let commands = ''

	child.execSync(`./vendor/dnadist`, {stdio: 'inherit'})

	return fs.readFileSync(outputFile, 'utf-8')
}

module.exports = dnadist


function main() {
	if (process.argv.length < 3) {
		throw Error('usage: node dnadist.js <input>')
	}

	console.log(dnadist(fs.readFileSync(process.argv[2], 'utf-8')))
}

if (require.main === module) {
	main()
}
