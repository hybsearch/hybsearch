'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const _ = require('lodash')

function clearcut(data, extension) {
	const tempInputFile = tempfile('.file')
	const outputFile = tempInputFile.replace('.file', extension)
	fs.writeFileSync(tempInputFile, data, {encoding: 'utf-8'})

	child.execSync(`./vendor/clearcut --aligned --DNA --stdin --stdout < '${tempInputFile.replace(' ', '\ ')}' > '${outputFile.replace(' ', '\ ')}'`)

	return fs.readFileSync(outputFile, {encoding: 'utf-8'})
}

module.exports = clearcut


function main() {
	if (process.argv.length < 3) {
		throw Error('usage: node clearcut.js <input>')
	}

	console.log(clearcut(fs.readFileSync(process.argv[2], 'utf-8'), '.clearcut'))
}

if (require.main === module) {
	main()
}
