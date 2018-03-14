/* eslint-env jest */

const { parse: newickToJson } = require('../../lib/newick')
const fs = require('fs')
const path = require('path')

describe('newick', () => {
	const base = path.join(__dirname, 'input')
	const files = fs.readdirSync(base).filter(f => f.endsWith('.tree'))

	for (const file of files) {
		it(file, () => {
			const content = fs.readFileSync(path.join(base, file), 'utf-8')
			const tree = newickToJson(content)
			expect(tree).toMatchSnapshot()
		})
	}
})
