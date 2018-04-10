/* eslint-env jest */

const fastaToBeast = require('../fasta-to-beast')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, 'input')
const files = fs.readdirSync(base).filter(f => f.endsWith('.fasta'))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file), 'utf-8')
		const tree = fastaToBeast(content)
		expect(tree).toMatchSnapshot()
	})
}
