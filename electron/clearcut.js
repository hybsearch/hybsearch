'use strict'

const child = require('child_process')
const tempfile = require('tempfile')
const fs = require('fs')
const _ = require('lodash')

function clearcut(data, extension) {
	const tempInputFile = tempfile('.file').replace(' ', '\ ')
	const outputFile = tempInputFile.replace('.file', extension)
	fs.writeFileSync(tempInputFile, data, 'utf-8')

	child.execSync(`./vendor/clearcut --alignment --DNA --neighbor --stdin --stdout < ${tempInputFile} > ${outputFile}`)

	return fs.readFileSync(outputFile, 'utf-8')
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
