#!/usr/bin/env node

const ent = require('../ent')

function main() {
	if (process.argv.length < 3) {
		throw Error('usage: run-ent.js <input-file>')
	}

	let contents = fs.readFileSync(process.argv[2], 'utf-8')
	contents = JSON.parse(contents)

	let ntree = _.cloneDeep(contents)

	mutatenm(ntree)

	console.log(JSON.stringify(ntree, null, 2))
}
