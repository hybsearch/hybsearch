'use strict'

const fastaToNexus = require('./fasta-to-nexus')
const fastaToBeast = require('./fasta-to-beast')
const fastaToPhylip = require('./fasta-to-phylip')
const genbankToFasta = require('./genbank-to-fasta')
const nexusToFasta = require('./nexus-to-fasta')
const fasta = require('./fasta')
const nexus = require('./nexus')

module.exports = {
	fastaToNexus: fastaToNexus,
	fastaToBeast: fastaToBeast,
	genbankToFasta: genbankToFasta,
	nexusToFasta: nexusToFasta,
	parseFasta: fasta.parse,
	buildFasta: fasta.build,
	hashFastaSequenceNames: fasta.hashFastaSequenceNames,
	removeFastaIdentifiers: fasta.removeFastaIdentifiers,
	keepFastaIdentifiers: fasta.keepFastaIdentifiers,
	fastaToPhylip: fastaToPhylip,
	hashNexusTreeNames: nexus.hashNexusTreeNames,
}
