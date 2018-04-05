'use strict'

const os = require('os')

module.exports = consensusTreeNewick
function consensusTreeNewick(input) {
	input = input.replace(RegExp(os.EOL, 'g'), '\n')

	let labelRegex = /taxlabels(\n\s*[^;]*)+\s;/i
	let labels = labelRegex.exec(input)[1]
	labels = labels
		.split('\n')
		.map(l => l.trim())
		.filter(x => Boolean(x))

	let treeRegex = /tree\s+\S+\s+=\s+(?:\[[^\n\r\]]+\]\s+)?([^;\n\r]+;)/gi
	let trees = treeRegex.exec(input).slice(1)

	let lastTree = trees[trees.length - 1]

	let conTree = lastTree.replace(/\[[^\]]+\]/g, '')

	for (let i = 0; i < labels.length; i++) {
		// replace numbers with names
		conTree = conTree.replace(`(${i + 1}:`, `(${labels[i]}:`)
		conTree = conTree.replace(`,${i + 1}:`, `,${labels[i]}:`)
	}

	return conTree
}
