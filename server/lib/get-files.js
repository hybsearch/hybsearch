'use strict'

const fs = require('fs')
const path = require('path')

const DIR = process.env.DOCKER
	? path.join(__dirname, '..', 'data') // '/data'
	: path.join(__dirname, '..', '..', 'data')

async function getFiles() {
	return fs
		.readdirSync(DIR)
		.filter(file => /\.(fasta|gb)$/.test(file))
		.map(f => ({ filename: f, filepath: f }))
}

async function loadFile(filename) {
	return fs.readFileSync(path.join(DIR, filename), 'utf-8')
}

module.exports = getFiles
module.exports.loadFile = loadFile
