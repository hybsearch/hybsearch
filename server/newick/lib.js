module.exports.getLeaves = getLeaves

function getLeaves(root) {
	let leafNodes = []

	const recurse = node => {
		if (node.branchset) {
			node.branchset.forEach(recurse)
		} else {
			leafNodes.push(node)
		}
	}
	recurse(root)

	return leafNodes
}
