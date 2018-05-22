'use strict'

const tempy = require('tempy')
const os = require('os')

const ent = require('../../ent')
const { consensusTreeToNewick, parse: parseNewick } = require('../../newick')
const {
	genbankToFasta,
	fastaToBeast,
	hashFastaSequenceNames,
	fastaToPhylip,
	hashNexusTreeNames,
	fastaToNexus,
	removeFastaIdentifiers,
	keepFastaIdentifiers,
} = require('../../formats')
const { pruneOutliers } = require('../../lib/prune-newick')
const {
	findSignificantNonmonophyly,
} = require('../../lib/find-significant-nonmonophyly')
const clustal = require('../../wrappers/clustal')
const beast = require('../../wrappers/beast')
const jml = require('../../wrappers/jml')
const mrBayes = require('../../wrappers/mrbayes')
const { removeCircularLinks } = require('../lib')

let options = {
	outlierRemovalPercentage: {
		default: 0.5,
		type: 'number',
		label: 'outlierRemovalPercentage',
		description: 'desc',
	},
	beastChainLength: {
		default: '10000000',
		type: 'text',
		label: "BEAST's 'chainLength' parameter",
		description: 'another desc',
	},
	beastCpuCoreCount: {
		default: os.cpus().length,
		type: 'number',
		label: "BEAST's CPU core count",
		description: 'the number of CPUs that BEAST should run over',
	},
	beastSyncStepSize: {
		default: 25000,
		type: 'number',
		label: "BEAST's syncronization step size",
		description: 'the number of iterations run between thread syncronizations',
	},
}

let steps = [
	{
		// the first step: ensures that the input is converted to FASTA
		input: ['source'],
		transform: ([{ filepath, contents }]) =>
			filepath.endsWith('.fasta') ? [contents] : [genbankToFasta(contents)],
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
			let { removedData, prunedNewick } = pruneOutliers(
				newickJson,
				alignedFasta,
				{ outlierRemovalPercentage }
			)
			return [prunedNewick, removedData]
		},
		output: ['newick-json:2', 'pruned-identifiers'],
	},
	{
		// identifies the non-monophyletic sequences
		input: ['newick-json:2'],
		transform: ([newickJson]) => [
			removeCircularLinks(ent.search(newickJson)),
			removeCircularLinks(newickJson),
		],
		output: ['nonmonophyletic-sequences', 'newick-json:3'],
	},
	{
		// converts the aligned FASTA into Nexus for BEAST, and removes the
		// nonmonophyletic sequences before aligning
		input: ['aligned-fasta', 'nonmonophyletic-sequences'],
		transform: (
			[data, nmSeqs],
			{ beastChainLength, beastCpuCoreCount, beastSyncStepSize }
		) => {
			let monophyleticFasta = removeFastaIdentifiers(data, nmSeqs)
			let nonmonophyleticFasta = keepFastaIdentifiers(data, nmSeqs)
			let beastParticleDir = tempy.directory()
			return [
				fastaToBeast(monophyleticFasta, {
					chainLength: beastChainLength,
					particleDir: beastParticleDir,
					numParticles: beastCpuCoreCount,
					stepSize: beastSyncStepSize,
				}),
				monophyleticFasta,
				nonmonophyleticFasta,
				beastParticleDir,
			]
		},
		output: [
			'beast-config',
			'monophyletic-aligned-fasta',
			'nonmonophyletic-aligned-fasta',
			'beast-particle-dir',
		],
	},
	{
		// generates the Species Tree used by JML
		input: ['beast-config', 'beast-particle-dir'],
		transform: ([data, particleDir]) => [beast(data, { particleDir })],
		output: ['beast-trees'],
	},
	{
		// turn aligned fasta into PHYLIP
		input: ['aligned-fasta', 'beast-trees'],
		transform: ([fasta, beastTrees]) => {
			let phylipIdentMap = hashFastaSequenceNames(fasta)
			return [
				phylipIdentMap,
				fastaToPhylip(fasta, phylipIdentMap),
				hashNexusTreeNames(beastTrees.species, phylipIdentMap),
			]
		},
		output: ['phylip-identifier-map', 'aligned-phylip', 'phylipified-trees'],
	},
	{
		// run JML
		input: ['phylipified-trees', 'aligned-phylip', 'phylip-identifier-map'],
		transform: ([phylipifiedTrees, alignedPhylip, phylipIdentMap]) => [
			jml({
				phylipData: alignedPhylip,
				trees: phylipifiedTrees,
				phylipMapping: phylipIdentMap,
			}),
		],
		output: ['jml-output'],
	},
	{
		// find the significant nonmonophetic sequences
		input: ['jml-output', 'nonmonophyletic-sequences'],
		transform: ([jmlOutput, nmSequences]) => [
			findSignificantNonmonophyly(jmlOutput, nmSequences),
		],
		output: ['significant-nonmonophyly'],
	},
]

module.exports = { steps, options }
