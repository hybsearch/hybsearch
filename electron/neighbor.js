'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const _ = require('lodash')

function neighbor(data) {
	const inputFile = tempfile().replace(' ', '\ ')
	const outputFile = tempfile().replace(' ', '\ ')
	fs.writeFileSync(inputFile, data, 'utf-8')

	let commands = [
		inputFile, // the input filename
		'F', // make a new file
		outputFile, // with this filename
		'Y', // the default options are good
		'F', // make a new file for the tree
		outputFile, // put it here again
		'R', // and overwrite it
	].join('\n')

	child.execSync(`echo "${commands}" | neighbor`, {stdio: 'inherit'})

	return fs.readFileSync(outputFile, 'utf-8')
}

module.exports = neighbor


function main() {
	if (process.argv.length < 3) {
		throw Error('usage: node neighbor.js <input>')
	}

	console.log(neighbor(fs.readFileSync(process.argv[2], 'utf-8'), '.neighbor'))
}

if (require.main === module) {
	main()
}
