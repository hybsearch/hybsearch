'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const _ = require('lodash')

function neighbor(data) {
	const inputFile = './infile'
	const outputFile = './outfile'
	fs.writeFileSync(inputFile, data, 'utf-8')

	let commands = [
		'D',
		'D',
		'Y',
	].join('\n')

	child.execSync(`echo "${commands}" | ./vendor/neighbor`)

	return fs.readFileSync(outputFile, 'utf-8')

	return fs.readFileSync(outputFile2, 'utf-8').split(';')[0] + ';'
}

module.exports = neighbor


function main() {
	if (process.argv.length < 3) {
		throw Error('usage: node neighbor.js <input>')
	}

	console.log(neighbor(fs.readFileSync(process.argv[2], 'utf-8')))
}

if (require.main === module) {
	main()
}
