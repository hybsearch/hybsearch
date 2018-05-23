// Prunes a newick tree to remove genes that are too dissimilar

const hammingDistance = require('../hamdis/hamming-distance')
const { parseFasta } = require('../formats/fasta/parse')
const { removeNodes } = require('./remove-nodes')
const { getLeafNodes } = require('./get-leaf-nodes')
const { removeRedundant } = require('./remove-redundant')
const SEQUENCE_CUTOFF_LENGTH = 300

module.exports.pruneOutliers = pruneOutliers

function pruneOutliers(
	newick,
	alignedFasta,
	{ outlierRemovalPercentage = 0.2 } = {}
) {
	const fastaData = parseFasta(alignedFasta)
	// Build a dict map of species -> sequence
	let sequenceMap = {}
	for (let obj of fastaData) {
		sequenceMap[obj.species] = obj.sequence
	}

	// Compute and store distances between each pair
	let leafNodes = getLeafNodes(newick)
	let {distances, geneLengths} = computeDistances(leafNodes, sequenceMap)

	let toRemoveNodes = []
	let diffRecords = new Map()

	// A sequence S will be removed if it is more than 20% different than a majority of the seqences
	// Or if it is smaller than the cut off
	for (let i = 0; i < leafNodes.length; i++) {
		let node = leafNodes[i]
		let gene1Length = geneLengths[i]
		let diffCount = 0

		let diffRecord = diffRecords.get(node.name)
		if (!diffRecord) {
			diffRecord = new Map()
			diffRecords.set(node.name, diffRecord)
		}

		for (let j = 0; j < leafNodes.length; j++) {
			if (i === j) {
				continue
			}

			let innerNode = leafNodes[j]
			let hammingDistance = distances[i][j]
			let gene2Length = geneLengths[j]

			// The hamming distance can be at most the size of the smaller
			// sequence. So to get the proportion, we divide it by the length
			// of the smaller sequence.
			let smallerGeneLength = Math.min(gene1Length, gene2Length)
			let diffProportion = hammingDistance / smallerGeneLength

			diffRecord.set(innerNode.name, diffProportion)

			if (diffProportion > outlierRemovalPercentage) {
				diffCount += 1
			}
		}

		let diffPercent = diffCount / (leafNodes.length - 1)

		if (diffPercent >= 0.5 || gene1Length < SEQUENCE_CUTOFF_LENGTH) {
			toRemoveNodes.push(node)
		}
	}

	// Now remove the nodes
	if (toRemoveNodes.length > 0) {
		let removedData = toRemoveNodes.map(({ name, length }) => ({
			name,
			length,
		}))
		let toRemoveNames = toRemoveNodes.map(node => node.name)

		removeNodes(newick, toRemoveNames)
		newick = removeRedundant(newick)
		delete newick.length

		return {
			prunedNewick: newick,
			removedData: removedData,
			diffRecords: diffRecords,
		}
	}

	return {
		prunedNewick: newick,
		removedData: [],
		diffRecords: diffRecords,
	}
}

function computeDistances(nodes, sequenceMap) {
	let distances = {}
	let geneLengths = {}

	for (let i = 0; i < nodes.length; i++) {
		let node = nodes[i]
		let species1 = node.name
		distances[i] = {}
		// Compute actual gene length
		geneLengths[i] = 0

		if (!sequenceMap[species1]) {
			throw new Error(`could not find ${species1}`)
		}

		for (let letter of sequenceMap[species1]) {
			if (letter !== '-') {
				geneLengths[i] += 1
			}
		}

		for (let j = 0; j < nodes.length; j++) {
			if (i === j) {
				continue
			}

			let species2 = nodes[j].name

			if (!sequenceMap[species2]) {
				throw new Error(`could not find ${species2}`)
			}

			let dist = hammingDistance(sequenceMap[species1], sequenceMap[species2])
			distances[i][j] = dist
		}
	}

	return {geneLengths, distances}
}
