/* eslint-env jest */

const {pruneOutliers} = require('../prune-newick')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, 'input')
const files = fs
	.readdirSync(base)
	.filter(f => f.endsWith('.tree'))
	.map(f => f.replace(/(.*)\.tree$/, '$1'))

for (const file of files) {
	test(file, () => {
		let content = fs.readFileSync(path.join(base, file) + '.tree', 'utf-8')

		let fasta = fs.readFileSync(path.join(base, file) + '.fasta', 'utf-8')
		let inputTree = JSON.parse(content)

		let {removedData} = pruneOutliers(inputTree, fasta)

		let removed = removedData.map(node => node.name)

		expect(removed).toMatchSnapshot()
	})
}