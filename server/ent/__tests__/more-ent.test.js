/* eslint-env jest */
require('jest-specific-snapshot')

const { removeFastaIdentifiers } = require('../../formats')
const { parseFasta } = require('../../formats/fasta/parse')
const { pruneOutliers } = require('../../lib/prune-newick')
const { removeCircularLinks } = require('../../pipeline/lib')

const ent = require('../index')
const { parse: newickToJson } = require('../../newick')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, '..', '..', '__supporting__', 'input')
const files = fs
	.readdirSync(base)
	.filter(f => f.endsWith('.tree'))
	.map(f => f.replace(/(.*)\.tree$/, '$1'))

for (const file of files) {
	let content = fs.readFileSync(path.join(base, file) + '.tree', 'utf-8')
	let alignedFasta = fs.readFileSync(path.join(base, file) + '.fasta', 'utf-8')
	let serializedTree = JSON.stringify(newickToJson(content))

	test(file, () => {
		let { prunedNewick } = pruneOutliers(
			JSON.parse(serializedTree),
			alignedFasta
		)

		let serializedNewick = JSON.stringify(prunedNewick)

		let nonmonoInfo = removeCircularLinks(
			ent.strictSearch(JSON.parse(serializedNewick), alignedFasta)
		)

		let monophyleticFasta = removeFastaIdentifiers(alignedFasta, nonmonoInfo)
		let results = parseFasta(monophyleticFasta).map(s => s.species)

		expect(results).toMatchSpecificSnapshot(`./__snapshots__/${file}.hybsnap`)
	})
}
