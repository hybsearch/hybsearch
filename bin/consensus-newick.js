#!/usr/bin/env node
'use strict'

const getData = require('./lib_get-data')

module.exports = consensusTreeNewick
function consensusTreeNewick(input) {
	let labelRegex = /taxlabels(\n\s*[^;]*)+\s;/
	let labels = labelRegex.exec(input)[1]
	labels = labels.split('\n').map(l => l.trim()).filter(x => x).map(l => l.replace('_', ' '))

	let treeRegex = /tree\s+\S+\s+=\s+\[[^\n\r\]]+\]\s+([^;\n\r]+;)/g
	let conTree = treeRegex.exec(input)[1]
	conTree = conTree.replace(/\[[^\]]+\]/g, "")

	for (let i = 0; i < labels.length; i++) {
		// replace numbers with names
		conTree = conTree.replace(`(${i + 1}:`, `(${labels[i]}:`)
		conTree = conTree.replace(`,${i + 1}:`, `,${labels[i]}:`)
	}

	return conTree
}

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node consensus-newick.js (<input> | -)')
		process.exit(1)
	}

	getData(file)
		.then(consensusTreeNewick)
		.then(data => console.log(data))
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
