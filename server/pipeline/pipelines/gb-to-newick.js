'use strict'

const { consensusTreeToNewick, parse: parseNewick } = require('../../newick')
const {
	genbankToFasta,
	fixFastaSource,
	fastaToNexus,
} = require('../../formats')
const { pruneOutliers } = require('../../lib/prune-newick')
const clustal = require('../../wrappers/clustal')
const mrBayes = require('../../wrappers/mrbayes')

let options = {
	outlierRemovalPercentage: {
		default: 0.2,
		type: 'number',
		label: 'outlierRemovalPercentage',
		description: 'desc',
	},
}

let steps = [
	{
		// the first step: ensures that the input is converted to FASTA
		input: ['source'],
		transform: ([{ filepath, contents }]) =>
			filepath.endsWith('.fasta')
				? [fixFastaSource(contents)]
				: [genbankToFasta(contents)],
		output: ['initial-fasta'],
	},
	{
		// aligns the FASTA sequences
		input: ['initial-fasta'],
		transform: ([data]) => [clustal(data)],
		output: ['aligned-fasta'],
	},
	{
		// converts the aligned FASTA into Nexus
		input: ['aligned-fasta'],
		transform: ([data]) => [fastaToNexus(data)],
		output: ['aligned-nexus'],
	},
	{
		// does whatever mrbayes does
		input: ['aligned-nexus'],
		transform: ([data]) => [mrBayes(data)],
		output: ['consensus-tree'],
	},
	{
		// turns MrBayes' consensus tree into a Newick tree
		input: ['consensus-tree'],
		transform: ([data]) => [consensusTreeToNewick(data)],
		output: ['newick-tree'],
	},
	{
		// turns the Newick tree into a JSON object
		input: ['newick-tree'],
		transform: ([data]) => [parseNewick(data)],
		output: ['newick-json:1'],
	},
	{
		input: ['newick-json:1', 'aligned-fasta'],
		transform: ([newickJson, alignedFasta], { outlierRemovalPercentage }) => {
			let { prunedNewick } = pruneOutliers(
				newickJson,
				alignedFasta,
				{ outlierRemovalPercentage }
			)

			return [prunedNewick]
		},
		output: ['newick-json:2'],
	},
]

module.exports = { steps, options }
