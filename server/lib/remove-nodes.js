'use strict'

module.exports.removeNodes = removeNodes
function removeNodes(node, identArray) {
	if (node.branchset) {
		let newBranchset = []
		for (let child of node.branchset) {
			let include = true

			if (!child.branchset) {
				if (
					(child.ident && identArray.indexOf(child.ident) !== -1) ||
					identArray.indexOf(child.name) !== -1
				) {
					include = false
				}
			}
			if (include) {
				newBranchset.push(child)
			}

			removeNodes(child, identArray)
		}

		node.branchset = newBranchset
	}
}
