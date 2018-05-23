// Prunes a newick tree to remove genes that are too dissimilar

const hammingDistance = require('../hamdis/hamming-distance')
const { parseFasta } = require('../formats/fasta/parse')
const { removeNodes } = require('./remove-nodes')
const SEQUENCE_CUTOFF_LENGTH = 300

module.exports.pruneOutliers = pruneOutliers

function pruneOutliers(
	newick,
	alignedFasta,
	{ outlierRemovalPercentage = 0.5 } = {}
) {
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

	// Compute and store distances between each pair
	getLeaves(newick)
	let distCache = {}
	let geneLength = {}

	for (let i = 0; i < leafNodes.length; i++) {
		let node = leafNodes[i]
		let species1 = node.name
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

			let species2 = leafNodes[j].name

			if (!sequenceMap[species2]) {
				throw new Error(`could not find ${species2}`)
			}

			let dist = hammingDistance(sequenceMap[species1], sequenceMap[species2])
			distCache[i][j] = dist
		}
	}

	let toRemoveNodes = []

	// A sequence S will be removed if it is more than 20% different than a majority of the seqences
	// Or if it is smaller than the cut off
	for (let i = 0; i < leafNodes.length; i++) {
		let node = leafNodes[i]
		let gene1Length = geneLength[i]
		let diffCount = 0

		for (let j = 0; j < leafNodes.length; j++) {
			if (i === j) {
				continue
			}
			let hammingDistance = distCache[i][j]
			let gene2Length = geneLength[j]

			// The hamming distance can be at most the size of the smaller
			// sequence. So to get the proportion, we divide it by the length
			// of the smaller sequence.
			let smallerGeneLength = Math.min(gene1Length, gene2Length)
			let diffProportion = hammingDistance / smallerGeneLength

			if (diffProportion > 0.2) {
				diffCount += 1
			}
		}

		let diffPercent = diffCount / (leafNodes.length - 1)
		node._diffPercent = diffPercent

		if (
			diffPercent >= outlierRemovalPercentage ||
			gene1Length < SEQUENCE_CUTOFF_LENGTH
		) {
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

		let toRemoveNames = toRemoveNodes.map(node => node.name)
		removeNodes(newick, toRemoveNames)
		newick = removeRedundant(newick)
		delete newick.length
	}

	return {
		prunedNewick: newick,
		removedData: removedData,
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
