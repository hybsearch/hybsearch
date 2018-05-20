'use strict'

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
const clustal = require('../../wrappers/clustal')
const beast = require('../../wrappers/beast')
const jml = require('../../wrappers/jml')
const mrBayes = require('../../wrappers/mrbayes')

module.exports = [
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
		output: ['newick-json:original'],
	},
	{
		input: ['newick-json:original', 'aligned-fasta'],
		transform: ([newickJson, alignedFasta]) => {
			let { removedData, prunedNewick } = pruneOutliers(
				newickJson,
				alignedFasta
			)
			return [prunedNewick, removedData]
		},
		output: ['newick-json:pruned', 'pruned-identifiers'],
	},
	{
		// identifies the non-monophyletic sequences
		input: ['newick-json:pruned'],
		transform: ([newickJson]) => [ent.search(newickJson)],
		output: ['nonmonophyletic-sequences'],
	},
	{
		// converts the aligned FASTA into Nexus for BEAST, and removes the
		// nonmonophyletic sequences before aligning
		input: ['aligned-fasta', 'nonmonophyletic-sequences'],
		transform: ([data, nmSeqs]) => {
			let monophyleticFasta = removeFastaIdentifiers(data, nmSeqs)
			let nonmonophyleticFasta = keepFastaIdentifiers(data, nmSeqs)
			return [
				fastaToBeast(monophyleticFasta),
				monophyleticFasta,
				nonmonophyleticFasta,
			]
		},
		output: [
			'beast-config',
			'monophyletic-aligned-fasta',
			'nonmonophyletic-aligned-fasta',
		],
	},
	{
		// generates the Species Tree used by JML
		input: ['beast-config'],
		transform: ([data]) => [beast(data)],
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
]
