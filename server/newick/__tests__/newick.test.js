/* eslint-env jest */
require('jest-specific-snapshot')

const newickToJson = require('../parser')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, '..', '..', '__supporting__', 'input')
const files = fs
	.readdirSync(base)
	.filter(f => f.endsWith('.tree'))
	.map(f => f.replace(/(.*)\.tree$/, '$1'))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file + '.tree'), 'utf-8')
		const tree = newickToJson(content)
		expect(tree).toMatchSpecificSnapshot(`./__snapshots__/${file}.hybsnap`)
	})
}
