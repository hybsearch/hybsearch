'use strict'

module.exports.trimEmptyBranches = trimEmptyBranches
function trimEmptyBranches(node) {
	// if there is no branchset, we need to keep this node as it's a leaf
	if (!node.branchset) {
		return true
	}

	// now we call trimEmptyBranches on all of our children, removing any that it returns false for
	node.branchset = node.branchset.filter(trimEmptyBranches)

	// if there are no branches, we want to remove this node
	if (!node.branchset.length) {
		return false
	}

	return true
}
