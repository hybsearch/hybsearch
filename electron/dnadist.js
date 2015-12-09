'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const _ = require('lodash')

function dnadist(data, extension) {
	const inputFile = tempfile().replace(' ', '\ ')
	const outputFile = tempfile().replace(' ', '\ ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	let commands = [
		inputFile,
		'F',
		outputFile,
		'Y',
	].join('\n')

	child.execSync(`echo "${commands}" | dnadist`)

	return fs.readFileSync(outputFile, 'utf-8')
}

module.exports = dnadist


function main() {
	if (process.argv.length < 3) {
		throw Error('usage: node dnadist.js <input>')
	}

	console.log(dnadist(fs.readFileSync(process.argv[2], 'utf-8'), '.dnadist'))
}

if (require.main === module) {
	main()
}
