// This file will prune a newick tree to remove genes that are too dissimilar.

const hammingDistance = require('../hamdis/hamming-distance')
const { parseFasta } = require('../formats/fasta/parse')
const { getLeaves } = require('../newick/lib')
const SEQUENCE_CUTOFF_LENGTH = 300

module.exports.pruneOutliers = pruneOutliers
module.exports.removeNodes = removeNodes

function pruneOutliers(newick, alignedFasta) {
	const fastaData = parseFasta(alignedFasta)
	// Build a dict map of species -> sequence
	let sequenceMap = {}
	for (let obj of fastaData) {
		sequenceMap[obj.species] = obj.sequence
	}

	let leafNodes = getLeaves(newick)

	// Compute and store distances between each pair
	let distCache = {}
	let geneLength = {}

	for (let i = 0; i < leafNodes.length; i++) {
		let node = leafNodes[i]
		let species1 = node.ident ? node.name + '__' + node.ident : node.name
		distCache[i] = {}
		// Compute actual gene length
		geneLength[i] = 0

		if (!sequenceMap[species1]) {
			throw new Error(`could not find ${species1}`)
		}

		for (let letter of sequenceMap[species1]) {
			if (letter !== '-') {
				geneLength[i] += 1
			}
		}

		for (let j = 0; j < leafNodes.length; j++) {
			if (i === j) {
				continue
			}

			let species2 = leafNodes[j].ident
				? leafNodes[j].name + '__' + leafNodes[j].ident
				: leafNodes[j].name

			if (!sequenceMap[species2]) {
				throw new Error(`could not find ${species2}`)
			}

			let dist = hammingDistance(sequenceMap[species1], sequenceMap[species2])
			distCache[i][j] = dist
		}
	}

	let toRemoveNames = []
	let toRemoveNodes = []

	// A sequence S will be removed if it is more than 20% different than a majority of the seqences
	// Or if it is smaller than the cut off
	for (let i = 0; i < leafNodes.length; i++) {
		let node = leafNodes[i]
		let gene1 = geneLength[i]
		let diffCount = 0

		for (let j = 0; j < leafNodes.length; j++) {
			if (i === j) {
				continue
			}
			let hammingDistance = distCache[i][j]
			let gene2 = geneLength[j]
			// The hamming distance can be at most the size of the smaller sequence
			// So to get the proportion, we divide it by the length of the smalle sequence
			let smallerGeneLength = Math.min(gene1, gene2)
			let diffProportion = hammingDistance / smallerGeneLength

			if (diffProportion > 0.2) {
				diffCount += 1
			}
		}

		let diffPercent = diffCount / (leafNodes.length - 1)

		if (diffPercent >= 0.5 || gene1 < SEQUENCE_CUTOFF_LENGTH) {
			if (node.ident) {
				toRemoveNames.push(node.ident)
			} else {
				toRemoveNames.push(node.name)
			}

			toRemoveNodes.push(node)
		}
	}

	// Now remove the nodes
	let removedData = []
	if (toRemoveNodes.length > 0) {
		removedData = toRemoveNodes.map(node => ({
			name: node.name,
			ident: node.ident,
			length: node.length,
		}))

		newick = removeNodes(newick, toRemoveNames)
		newick = removeRedundant(newick)
		// TODO: why do we mutate here?
		delete newick.length
	}

	return {
		prunedNewick: newick,
		removedData: removedData,
	}
}

function removeNodes(node, identArray) {
	if (!node.branchset) {
		return node
	}

	let newBranchset = node.branchset
		.filter(child => {
			if (child.branchset) {
				return true
			}

			if (identArray.includes(child.ident) || identArray.includes(child.name)) {
				return false
			}

			return true
		})
		.map(child => removeNodes(child, identArray))

	return { ...node, branchset: newBranchset }
}

function hasSingleChildWithChildren(node) {
	return (
		node.branchset && node.branchset.length === 1 && node.branchset[0].branchset
	)
}

function removeRedundant(node) {
	if (!node.branchset) {
		return node
	}

	// If a node points to just one branch, go down until you hit something
	// that's either a leaf or just more than one branch, and set that to be
	// the thing it points to
	if (hasSingleChildWithChildren(node)) {
		return removeRedundant(node.branchset[0])
	}

	let newBranchset = node.branchset.map(child => {
		// if the child has only a single child, just remove the
		// intermediate node
		if (hasSingleChildWithChildren(child)) {
			return child.branchset[0]
		}
		return child
	})

	newBranchset = newBranchset.filter(child => {
		// If there is no child of this node
		if (child.branchset && child.branchset.length === 0) {
			// This should not be included!
			return false
		}
		return true
	})

	// TODO: Can this re-use hasSingleChildWithChildren?
	if (newBranchset.length === 1) {
		return removeRedundant(newBranchset[0])
	}

	return { ...node, branchset: newBranchset }
}
