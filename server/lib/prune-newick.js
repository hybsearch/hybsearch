/*
This file will prune a newick tree to remove genes that are too dissimilar. 
*/

module.exports.pruneOutliers = pruneOutliers

function pruneOutliers(newick){
	let leafNodes = []
	function GetLeaves(node) {
		if (node.branchset) {
			node.branchset.forEach(GetLeaves)
		} else {
			leafNodes.push(node)
		}
	}
	// Compute average lengths of the nodes
	GetLeaves(newick)
	let average = 0;
	for(let leaf of leafNodes) {
		average += leaf.length
	}
	average /= leafNodes.length
	// Compute standard deviation 
	let std = 0;
	for(let leaf of leafNodes) {
		std += Math.pow((leaf.length - average),2)
	}
	std /= leafNodes.length
	std = Math.sqrt(std)
	// If a value's diff from the mean is larger than 2 * std, then chuck it
	let toRemoveNames = []
	let toRemoveNodes = []
	for(let leaf of leafNodes) {
		let min = average - std * 2; 
		let max = average + std * 2; 
		if(leaf.length < min || leaf.length > max){
			if(leaf.ident){
				toRemoveNames.push(leaf.ident)
			} else {
				toRemoveNames.push(leaf.name)
			}

			toRemoveNodes.push(leaf)
		}

	}
	// Now remove the nodes 
	let removedData = {total:0,standardDeviation:std}

	if(toRemoveNodes.length != 0){
		removedData.total = toRemoveNodes.length
		removedData.formattedNames = '<pre>'
		for(let node of toRemoveNodes){
			let name = node.name; 
			if(node.ident){
				name += `[${node.ident}]`;
			}
			removedData.formattedNames += String(name) + " (" + String(node.length) + ")"
			removedData.formattedNames += '\n'
		}
		removedData.formattedNames += '</pre>'
		removeNodes(newick,toRemoveNames)
		newick = removeRedundant(newick)
		delete newick.length
	}


	return {prunedNewick:newick,removedData:removedData}
}

function removeNodes(node,identArray) {
	if (node.branchset) {
		let new_branchset = []
		for(let child of node.branchset) {
			let include = true;

			if(!child.branchset){
				if((child.ident && identArray.indexOf(child.ident) != -1) || (identArray.indexOf(child.name) != -1)){
					include = false;
				}
			}
			if(include){
				new_branchset.push(child)
			}

			removeNodes(child,identArray)
		}

		node.branchset = new_branchset
	}
}

function removeRedundant(node){
	// If a node points to just one branch, go down until you hit 
	// something that's either a leaf or just more than one branch, and set that to be 
	// the thing it points to 
	if(node.branchset && node.branchset.length == 1 && node.branchset[0].branchset){
		return removeRedundant(node.branchset[0])
	} else {
		let new_branchset = []
		for(let child of node.branchset) {
			if(child.branchset && child.branchset.length == 1 && child.branchset[0].branchset){
				child = removeRedundant(child)
			}

			new_branchset.push(child)
		}
		node.branchset = new_branchset

		return node
	}
}