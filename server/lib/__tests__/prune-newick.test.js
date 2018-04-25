/* eslint-env jest */
const { pruneOutliers } = require('../prune-newick')
const { parse: newickToJson } = require('../../newick')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, '..', '..', 'ent', '__tests__', 'input')
const files = fs
	.readdirSync(base)
	.filter(f => f.endsWith('.tree'))
	.map(f => f.replace(/(.*)\.tree$/, '$1'))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file) + '.tree', 'utf-8')
		const tree = newickToJson(content)

		const fasta = fs.readFileSync(path.join(base, file) + '.fasta', 'utf-8')

		const actual = pruneOutliers(tree, fasta)
		expect(actual).toMatchSnapshot()
	})
}
