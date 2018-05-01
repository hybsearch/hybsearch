/* eslint-env jest */
require('jest-specific-snapshot')

const { strictSearch: search, formatData } = require('../index')
const { parse: newickToJson } = require('../../newick')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, '..', '..', '..', 'data', '__supporting__')
const blacklist = ['bataguridae-cytb.gb']
const files = fs
	.readdirSync(base)
	.filter(name => !name.startsWith('.') && !name.startsWith('_'))
	.filter(name => !blacklist.includes(name))

for (const file of files) {
	const read = name => fs.readFileSync(path.join(base, file, name), 'utf-8')
	test(file, () => {
		const fasta = read('aligned-fasta')
		const content = read('newick-tree')
		const tree = newickToJson(content)

		const actual = formatData(search(tree, fasta))
		expect(actual.split('\n').filter(str => str.length > 0)).toMatchSpecificSnapshot(path.join('.', '__snapshots__', file + '.hybsnap'))
	})
}
