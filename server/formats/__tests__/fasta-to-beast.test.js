/* eslint-env jest */
require('jest-specific-snapshot')

const fastaToBeast = require('../fasta-to-beast')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, '..', '..', '..', 'data', '__supporting__')
const whitelist = ['emydura-short.gb']
const files = fs
	.readdirSync(base)
	.filter(name => !name.startsWith('.') && !name.startsWith('_'))
	.filter(name => name.endsWith('.gb'))
	.filter(name => whitelist.includes(name))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file, 'aligned-fasta'), 'utf-8')
		const tree = fastaToBeast(content)
		expect(tree).toMatchSpecificSnapshot(path.join('.', '__snapshots__', 'fasta-to-beast.' + file + '.hybsnap'))
	})
}
