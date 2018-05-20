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
	let sequenceMap = new Map()
	for (let obj of fastaData) {
		sequenceMap.set(obj.species, obj.sequence)
	}

	let leafNodes = getLeaves(newick)

	// Compute and store distances between each pair
	let distCache = new Map()
	let geneLength = new Map()

	leafNodes.forEach(node1 => {
		let species1 = node1.ident ? node1.name + '__' + node1.ident : node1.name
		let sequence1 = sequenceMap.get(species1)
		if (!sequence1) {
			throw new Error(`could not find ${species1}`)
		}

		let innerDistCache = new Map()
		distCache.set(node1, innerDistCache)

		// Compute actual gene length
		let filteredGene = [...sequenceMap.get(species1)].filter(ch => ch !== '-')
		geneLength.set(node1, filteredGene.length)

		leafNodes.forEach(node2 => {
			if (node1 === node2) {
				return
			}

			let species2 = node2.ident ? node2.name + '__' + node2.ident : node2.name
			let sequence2 = sequenceMap.get(species2)
			if (!sequence2) {
				throw new Error(`could not find ${species2}`)
			}

			let dist = hammingDistance(sequence1, sequence2)
			innerDistCache.set(node2, dist)
		})
	})

	// A sequence S will be removed if it is more than 20% different (1) than a
	// majority of the sequences (2), or if it is smaller than the cutoff (3).
	let toRemoveNodes = leafNodes.filter(node1 => {
		let gene1Distance = geneLength.get(node1)

		// (3) [if smaller than the cutoff]
		if (gene1Distance < SEQUENCE_CUTOFF_LENGTH) {
			return true
		}

		let significantDiffs = leafNodes.filter(node2 => {
			if (node1 === node2) {
				return false
			}

			let gene2Distance = geneLength.get(node2)

			let hammingDistance = distCache.get(node1).get(node2)

			// The hamming distance can be at most the size of the smaller
			// sequence. So to get the proportion, we divide it by the length
			// of the smaller sequence
			let smallerGeneLength = Math.min(gene1Distance, gene2Distance)
			let diffProportion = hammingDistance / smallerGeneLength

			// (1) [more than 20% different]
			return diffProportion > 0.2
		})

		let diffPercent = significantDiffs.length / (leafNodes.length - 1)

		// (2) [than a majority of the sequences]
		return diffPercent >= 0.5
	})
	let toRemoveNames = toRemoveNodes.map(node => node.ident || node.name)

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

	let newBranchset = node.branchset.filter(child => {
		// If we have a child, we want to preserve this node
		if (child.branchset) {
			return true
		}

		// Otherwise, if this node is one to remove, remove it
		if (identArray.includes(child.ident) || identArray.includes(child.name)) {
			return false
		}

		// Otherwise, keep it
		return true
	})

	newBranchset = newBranchset.map(child => removeNodes(child, identArray))

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
