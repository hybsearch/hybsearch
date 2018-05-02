/* eslint-env jest */
require('jest-specific-snapshot')

const consensusToNewick = require('../consensus-to-newick')
const fs = require('fs')
const path = require('path')

describe('trees from MrBayes', () => {
	const base = path.join(__dirname, 'mrbayes-trees')
	const files = fs.readdirSync(base).filter(f => f.endsWith('.nexus'))

	for (const file of files) {
		test(file, () => {
			const content = fs.readFileSync(path.join(base, file), 'utf-8')
			const tree = consensusToNewick(content)
			expect(tree).toMatchSpecificSnapshot(path.join('.', '__snapshots__', file + '.hybsnap'))
		})
	}
})

describe('trees from BEAST', () => {
	const base = path.join(__dirname, 'beast-trees')
	const files = fs.readdirSync(base).filter(f => f.endsWith('.nexus'))

	for (const file of files) {
		test(file, () => {
			const content = fs.readFileSync(path.join(base, file), 'utf-8')
			const tree = consensusToNewick(content)
			expect(tree).toMatchSpecificSnapshot(path.join('.', '__snapshots__', file + '.hybsnap'))
		})
	}
})
