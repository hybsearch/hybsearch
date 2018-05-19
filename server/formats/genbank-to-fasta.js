'use strict'

const { buildFasta } = require('./fasta/build')
const wrap = require('wordwrap')

function* parseGenbankEntry(data) {
	let current = ''
	for (let line of data.split(/\n/)) {
		// this whole loop is just so that we can get the "multi-line" values stuck
		// back into the keys they belong to.

		// skip the empty lines
		if (!line.trim()) {
			continue
		}

		// the top-level keys in the genbank format go from 0..12
		const key = line.substr(0, 12)
		// and so the "values" are the rest of the lines
		const value = line.substr(12)

		if (current === 'FEATURES') {
			if (key.trim() !== 'ORIGIN') {
				yield [current, line]
				continue
			}
		}

		if (current === 'ORIGIN') {
			// the origin lines go from column 10 to ~80
			const data = line.substr(10)
			yield [current, data]
			continue
		}

		const keyNameRegex = /^\s*([A-Z]+)\s*/
		if (keyNameRegex.test(key)) {
			current = keyNameRegex.exec(key)[1]
		}

		yield [current, value]
	}
}

function genbankEntryToObject(data) {
	let retval = {}

	for (let [key, value] of parseGenbankEntry(data)) {
		retval.hasOwnProperty(key)
			? (retval[key] += ` ${value}`)
			: (retval[key] = value)
	}

	return retval
}

const genbankEntryToFasta = entry => {
	// We only want the first two words in the ORGANISM field
	let species = entry.__prettyOrganism

	// Genbank (or some tool) doesn't like spaces in the names
	species = species.replace(/[^a-z0-9]/gi, '_')

	let accession = entry.ACCESSION.split(/\s/)
	accession = accession[0]
	if (!accession) {
		throw new Error('no accession number found!')
	}

	let origin = entry.ORIGIN
	origin = origin.replace(/ /g, '')
	origin = wrap(80, { mode: 'hard' })(origin)

	let divider = '__'
	let name = `${species}${divider}${accession}`

	// mrbayes only accepts names of < 99 chars
	if (name.length > 99) {
		let cutoff = name.length + accession.length + divider.length - 99
		name = `${name.substr(0, cutoff)}${divider}${accession}`
	}

	return { species: name, sequence: origin }
}

module.exports = genbankToFasta
function genbankToFasta(genbankFile) {
	const entries = genbankFile.split(/^\s*\/\/\s*$/m)

	// turn strings into objects with named keys
	const entryObjects = entries.map(genbankEntryToObject)

	// prevent empty objects ("entries") from making it to the final file
	let actualEntries = entryObjects.filter(
		entry => Object.keys(entry).length > 0
	)

	actualEntries = actualEntries
		.map(entry => {
			let pretty = entry.ORGANISM.split(/\s+/)
				.slice(0, 2)
				.join(' ')
			return Object.assign({}, entry, {__prettyOrganism: pretty})
		})
		.filter(entry => {
			// exclude all entries that end in "sp" or "sp."
			let endsInSp = entry.__prettyOrganism.match(/\ssp(?:\.|\s)/)
			return !endsInSp
		})

	// convert entries into the expected format for building a fasta file
	const fastaEntries = actualEntries.map(genbankEntryToFasta)

	// build and return the fasta file as a string
	return buildFasta(fastaEntries)
}
