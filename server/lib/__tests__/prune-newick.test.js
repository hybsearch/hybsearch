/* eslint-env jest */
require('jest-specific-snapshot')

const { pruneOutliers } = require('../prune-newick')
const { parse: parseNewick } = require('../../newick')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, '..', '..', '__supporting__', 'input')
const files = fs
	.readdirSync(base)
	.filter(f => f.endsWith('.tree'))
	.map(f => f.replace(/(.*)\.tree$/, '$1'))

for (const file of files) {
	test(file, () => {
		let content = fs.readFileSync(path.join(base, file) + '.tree', 'utf-8')
		let inputTree = parseNewick(content)

		let fasta = fs.readFileSync(path.join(base, file) + '.fasta', 'utf-8')

		let { removedData, diffRecords, prunedNewick } = pruneOutliers(inputTree, fasta)

		let removed = removedData.map(node => node.name)
		let diffs = new Map(
			[...diffRecords.entries()].map(([key, values]) => [
				key,
				new Map([...values.entries()].slice(0, 5)),
			])
		)

		expect(removed).toMatchSpecificSnapshot(
			`./__snapshots__/${file}.removals.hybsnap`
		)
		expect(prunedNewick).toMatchSpecificSnapshot(
			`./__snapshots__/${file}.tree.hybsnap`
		)
		expect(diffs).toMatchSpecificSnapshot(
			`./__snapshots__/${file}.diffs.hybsnap`
		)
	})
}
