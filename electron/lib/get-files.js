'use strict'

const fs = require('fs')
const path = require('path')

function getFiles() {
	return fs
		.readdirSync(path.join(__dirname, '..', '..', 'data'))
		.filter(file => !/\.aln\./.test(file)) // remove the aligned fasta files
		.filter(file => /\.(fasta|gb)$/.test(file))
}

module.exports = getFiles
