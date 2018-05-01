/* eslint-env jest */
require('jest-specific-snapshot')

const { strictSearch: search, formatData } = require('../index')
const { parse: newickToJson } = require('../../newick')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, 'input')
const files = fs
	.readdirSync(base)
	.filter(f => f.endsWith('.tree'))
	.map(f => f.replace(/(.*)\.tree$/, '$1'))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file) + '.tree', 'utf-8')
		const tree = newickToJson(content)

		const fasta = fs.readFileSync(path.join(base, file) + '.fasta', 'utf-8')

		const actual = formatData(search(tree, fasta))
		expect(actual.split('\n')).toMatchSpecificSnapshot(path.join('.', '__snapshots__', file + '.hybsnap'))
	})
}
