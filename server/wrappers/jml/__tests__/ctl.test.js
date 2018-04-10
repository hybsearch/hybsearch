/* eslint-env jest */

const generateControlFile = require('../ctl')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, 'input')
const files = fs.readdirSync(base).filter(f => f.endsWith('.phy'))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file), 'utf-8')
		const tree = generateControlFile(content)
		expect(tree).toMatchSnapshot()
	})
}
