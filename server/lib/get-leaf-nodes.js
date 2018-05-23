'use strict'

module.exports.getLeafNodes = getLeafNodes

function getLeafNodes(node) {
	let leafNodes = []

	const recurse = node => {
		if (node.branchset) {
			node.branchset.forEach(recurse)
		} else {
			leafNodes.push(node)
		}
	}

	recurse(node)
	return leafNodes
}
