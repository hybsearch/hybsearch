'use strict'

const fs = require('fs')
const path = require('path')

const DIR = process.env.NODE_ENV === 'production'
		? path.join(__dirname, '..', 'data')
		: path.join(__dirname, '..', '..', 'data')

async function getFiles() {
	return fs
		.readdirSync(DIR)
		.filter(file => /\.(fasta|gb)$/.test(file))
		.map(f => ({ filename: f, filepath: f }))
}

module.exports = getFiles
module.exports.dir = DIR
