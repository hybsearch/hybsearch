/* eslint-env jest */

const { fastaToBeast, removeFastaIdentifiers } = require('../../formats')
const { pruneOutliers } = require('../../lib/prune-newick')
const { removeCircularLinks } = require('../../pipeline/lib')

const ent = require('../index')
const { parse: newickToJson } = require('../../newick')
const fs = require('fs')
const path = require('path')
const flatten = require('lodash/flatten')

const base = path.join(__dirname, 'input')
const files = fs
	.readdirSync(base)
	.filter(f => f.endsWith('.tree'))
	.map(f => f.replace(/(.*)\.tree$/, '$1'))

let whitelist = ['coyote-test']

for (const file of files) {
	if (!whitelist.includes(file)) {
		continue
	}

	let content = fs.readFileSync(path.join(base, file) + '.tree', 'utf-8')
	let alignedFasta = fs.readFileSync(path.join(base, file) + '.fasta', 'utf-8')
	let serializedTree = JSON.stringify(newickToJson(content))

	test(file, () => {
		let { prunedNewick } = pruneOutliers(
			JSON.parse(serializedTree),
			alignedFasta
		)

		let serializedNewick = JSON.stringify(prunedNewick)

		let nonmonoInfo = removeCircularLinks(
			ent.strictSearch(JSON.parse(serializedNewick), alignedFasta)
		)

		let identifiers = flatten(
			nonmonoInfo.nm.map(pair =>
				pair.map(node => `${node.name}__${node.ident}`)
			)
		)

		let monophyleticFasta = removeFastaIdentifiers(alignedFasta, identifiers)
		let beastConfig = fastaToBeast(monophyleticFasta)

		expect(beastConfig).toMatchSnapshot()
	})
}
