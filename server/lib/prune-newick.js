/*
This file will prune a newick tree to remove genes that are too dissimilar.
*/

const hammingDistance = require('../hamdis/hamming-distance')
const { parseFasta } = require('../formats/fasta/parse')

module.exports.pruneOutliers = pruneOutliers

function pruneOutliers(newick, alignedFasta) {
	const fastaData = parseFasta(alignedFasta)
	// Build a dict map of species -> sequence
	let sequenceMap = {}
	for (let obj of fastaData) {
		sequenceMap[obj.species] = obj.sequence
	}

	let leafNodes = []
	function getLeaves(node) {
		if (node.branchset) {
			node.branchset.forEach(getLeaves)
		} else {
			leafNodes.push(node)
		}
	}

	// Compute average and standard deviation of all the pairs of distances
	getLeaves(newick)
	let average = 0
	let totalDistances = []
	let distCache = {}

	for (let i = 0; i < leafNodes.length; i++) {
		let node = leafNodes[i]
		let species1 = node.ident ? node.name + '__' + node.ident : node.name
		distCache[i] = {}
		for (let j = 0; j < leafNodes.length; j++) {
			if (i === j) {
				continue
			}

			let species2 = leafNodes[j].ident
				? leafNodes[j].name + '__' + leafNodes[j].ident
				: leafNodes[j].name
			let dist = hammingDistance(sequenceMap[species1], sequenceMap[species2])
			average += dist
			totalDistances.push(dist)
			distCache[i][j] = dist
		}
	}
	average /= totalDistances.length

	let std = 0
	for (let dist of totalDistances) {
		std += Math.pow(dist - average, 2)
	}
	std /= totalDistances.length
	std = Math.sqrt(std)

	let toRemoveNames = []
	let toRemoveNodes = []

	// Remove things if a majority of their pair checks are above average
	for (let i = 0; i < leafNodes.length; i++) {
		let node = leafNodes[i]
		let diffCount = 0

		for (let j = 0; j < leafNodes.length; j++) {
			if (i === j) {
				continue
			}
			let diff = distCache[i][j]
			if (diff > average) {
				diffCount++
			}
		}
		let diffPercent = diffCount / (leafNodes.length - 1)
		if (diffPercent >= 0.75) {
			if (node.ident) {
				toRemoveNames.push(node.ident)
			} else {
				toRemoveNames.push(node.name)
			}

			toRemoveNodes.push(node)
		}
	}

	// Now remove the nodes
	let removedData = { total: 0, standardDeviation: std }

	if (toRemoveNodes.length !== 0) {
		removedData.total = toRemoveNodes.length
		removedData.formattedNames = '<pre>'
		for (let node of toRemoveNodes) {
			let name = node.name
			if (node.ident) {
				name += `[${node.ident}]`
			}
			removedData.formattedNames +=
				String(name) + ' (' + String(node.length) + ')'
			removedData.formattedNames += '\n'
		}
		removedData.formattedNames += '</pre>'
		removeNodes(newick, toRemoveNames)
		newick = removeRedundant(newick)
		delete newick.length
	}

	return { prunedNewick: newick, removedData: removedData }
}

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

function removeRedundant(node) {
	// If a node points to just one branch, go down until you hit
	// something that's either a leaf or just more than one branch, and set that to be
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
