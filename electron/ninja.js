'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const _ = require('lodash')

function ninja(data, extension) {
	const tempInputFile = tempfile('.file')
	const outputFile = tempInputFile.replace('.file', extension)
	fs.writeFileSync(tempInputFile, data, {encoding: 'utf-8'})

	child.execSync(`./ninja '${tempInputFile.replace(' ', '\ ')}' > '${outputFile.replace(' ', '\ ')}'`)
	console.log(fs.readFileSync(outputFile, {encoding: 'utf-8'}))

	return fs.readFileSync(outputFile, {encoding: 'utf-8'})
}

module.exports = ninja


function main() {
	if (process.argv.length < 3) {
		throw Error('usage: node clustal.js <input>')
	}

	console.log(ninja(fs.readFileSync(process.argv[2]), '.ninjaout'))
}

if (require.main === module) {
	main()
}
