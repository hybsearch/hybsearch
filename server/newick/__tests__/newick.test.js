/* eslint-env jest */
require('jest-specific-snapshot')

const newickToJson = require('../parser')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, '..', '..', '..', 'data', '__supporting__')
const blacklist = []
const files = fs
	.readdirSync(base)
	.filter(name => !name.startsWith('.') && !name.startsWith('_'))
	.filter(name => name.endsWith('.gb'))
	.filter(name => !blacklist.includes(name))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file, 'newick-tree'), 'utf-8')
		const tree = newickToJson(content)
		expect(tree).toMatchSpecificSnapshot(path.join('.', '__snapshots__', file + '.hybsnap'))
	})
}
