'use strict'

const fastaToNexus = require('./fasta-to-nexus')
const genbankToFasta = require('./genbank-to-fasta')
const nexusToFasta = require('./nexus-to-fasta')
const fasta = require('./fasta')

module.exports = {
	fastaToNexus: fastaToNexus,
	genbankToFasta: genbankToFasta,
	nexusToFasta: nexusToFasta,
	parseFasta: fasta.parse,
	buildFasta: fasta.build,
}
