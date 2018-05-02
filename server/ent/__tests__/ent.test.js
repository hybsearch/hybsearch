/* eslint-env jest */
require('jest-specific-snapshot')

const { strictSearch: search, formatData } = require('../index')
const { parse: newickToJson } = require('../../newick')
const {pruneOutliers} = require('../../lib/prune-newick')
const fs = require('fs')
const path = require('path')
const cloneDeep = require('lodash/cloneDeep')

const base = path.join(__dirname, '..', '..', '..', 'data', '__supporting__')
const blacklist = ['bataguridae-cytb.gb', 'trionychcytb.gb']
const files = fs
	.readdirSync(base)
	.filter(name => !name.startsWith('.') && !name.startsWith('_'))
	.filter(name => name.endsWith('.gb'))
	.filter(name => !blacklist.includes(name))

for (const file of files) {
	const read = name => fs.readFileSync(path.join(base, file, name), 'utf-8')

	const fasta = read('aligned-fasta')
	const content = read('newick-tree')
	const _tree = newickToJson(content)

	test(file + ' (pruned)', () => {
		let tree = cloneDeep(_tree)
		let { prunedNewick } = pruneOutliers(tree, fasta)
		let actual = formatData(search(prunedNewick, fasta))
		expect(actual.split('\n').filter(str => str.length > 0)).toMatchSpecificSnapshot(path.join('.', '__snapshots__', file + '.pruned.hybsnap'))
	})

	test(file + ' (unpruned)', () => {
		let tree = cloneDeep(_tree)
		let actual = formatData(search(tree, fasta))
		expect(actual.split('\n').filter(str => str.length > 0)).toMatchSpecificSnapshot(path.join('.', '__snapshots__', file + '.hybsnap'))
	})
}
