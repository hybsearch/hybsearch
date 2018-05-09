'use strict'

const build = require('./build')
const parse = require('./parse')
const hashFastaSequenceNames = require('./hash-names')
const removeFastaIdentifiers = require('./remove-identifiers')
const keepFastaIdentifiers = require('./keep-identifiers')

module.exports = {
	build,
	parse,
	hashFastaSequenceNames,
	removeFastaIdentifiers,
	keepFastaIdentifiers,
}
