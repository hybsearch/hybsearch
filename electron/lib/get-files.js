'use strict'

const fs = require('fs')
const path = require('path')

function getFiles() {
	let dataDir = path.join(__dirname, '..', 'out', 'data')

	return fs
		.readdirSync(dataDir)
		.filter(file => /\.(fasta|gb)$/.test(file))
		.map(f => ({ filename: f, filepath: path.join(dataDir, f) }))
}

module.exports = getFiles
