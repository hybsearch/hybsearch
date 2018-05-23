'use strict'

module.exports.removeRedundant = removeRedundant
function removeRedundant(node) {
	// If a node points to just one branch, go down until you hit something
	// that's either a leaf or just more than one branch, and set that to be
	// the thing it points to
	if (
		node.branchset &&
		node.branchset.length === 1 &&
		node.branchset[0].branchset
	) {
		return removeRedundant(node.branchset[0])
	} else {
		let newBranchset = []
		for (let child of node.branchset) {
			if (
				child.branchset &&
				child.branchset.length === 1 &&
				child.branchset[0].branchset
			) {
				child = removeRedundant(child)
			}

			if (child.branchset && child.branchset.length === 0) {
				// This should not be included!
			} else {
				newBranchset.push(child)
			}
		}
		if (newBranchset.length === 1) {
			return removeRedundant(newBranchset[0])
		} else {
			node.branchset = newBranchset
		}

		return node
	}
}
