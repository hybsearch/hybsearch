#!/usr/bin/env node
'use strict'

const getData = require('../lib/get-data')

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
			if (!key.trim().startsWith('ORIGIN')) {
				yield [current, line]
				continue
			}
		} else if (current === 'ORIGIN') {
			// the origin lines go from column 10 to ~80
			const data = line.substr(10)
			yield [current, data]
			continue
		}

		const keyNameRegex = /\s*([A-Z]+)\s*/
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
	let definition = entry.DEFINITION
	// we've decided that we don't need any information after the first comma
	definition = definition.split(',')[0]
	// genbank (or some tool) doesn't like spaces in the names
	definition = definition.replace(/[^a-z0-9]/gi, '_')

	let accession = entry.ACCESSION

	let origin = entry.ORIGIN
	origin = origin.replace(/ /g, '')

	let divider = '__'
	let name = `${definition}${divider}${accession}`

	// mrbayes only accepts names of < 99 chars
	if (name.length > 99) {
		let cutoff = name.length + accession.length + divider.length - 99
		name = `${definition.substr(0, cutoff)}${divider}${accession}`
	}

	return `> ${name}\n${origin}\n`
}

module.exports = genbankToFasta
function genbankToFasta(genbankFile) {
	const entries = genbankFile.split('//')

	return (
		entries
			.map(genbankEntryToObject)
			// prevent empty objects ("entries") from making it to the final file
			.filter(entry => Object.keys(entry).length > 0)
			.map(genbankEntryToFasta)
			.join('\n')
	)
}

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node genbank-to-fasta.js (<input> | -)')
		process.exit(1)
	}

	return getData(file)
		.then(genbankToFasta)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
