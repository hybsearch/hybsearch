'use strict'

const os = require('os')

module.exports = consensusTreeNewick
function consensusTreeNewick(input) {
	input = input.replace(RegExp(os.EOL, 'g'), '\n')
	let labelRegex = /taxlabels(\n\s*[^;]*)+\s;/
	let labels = labelRegex.exec(input)[1]
	labels = labels
		.split('\n')
		.map(l => l.trim())
		.filter(x => x)

	let treeRegex = /tree\s+\S+\s+=\s+\[[^\n\r\]]+\]\s+([^;\n\r]+;)/g
	let conTree = treeRegex.exec(input)[1]
	conTree = conTree.replace(/\[[^\]]+\]/g, '')

	for (let i = 0; i < labels.length; i++) {
		// replace numbers with names
		conTree = conTree.replace(`(${i + 1}:`, `(${labels[i]}:`)
		conTree = conTree.replace(`,${i + 1}:`, `,${labels[i]}:`)
	}

	return conTree
}
