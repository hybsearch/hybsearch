// @ts-check
'use strict'

const d3 = require('d3')
d3.phylogram = require('../vendor/d3.phylogram')

const ent = require('../lib/ent')

module.exports.load = load
function load(newick) {
	const newickNodes = []
	function buildNewickNodes(node) {
		newickNodes.push(node)
		if (node.branchset) {
			node.branchset.forEach(buildNewickNodes)
		}
	}

	buildNewickNodes(newick)
	let nmResults = ent.strictSearch(newick)
	let results = ent.formatData(nmResults)
	let resultsEl = document.querySelector('#nonmonophyly-results')
	resultsEl.innerHTML = `<pre>${results}</pre>`
	document.querySelector('#nm-container').hidden = false

	console.log('Got nodes:', newickNodes)
	console.log('nonmonophyly:', nmResults)

	// Scale the generated tree based on largest branch length
	const smallest = getSmallestLength(newickNodes)
	const largest = getLargestLength(newickNodes)
	const ratio = largest / smallest * 15
	const maxWidth = document.getElementById('phylogram').offsetWidth - 320 // Accounts for label widths
	const calcWidth = Math.max(500, Math.min(maxWidth, ratio))

	console.log(
		`Final calcWidth: ${calcWidth}, maxWidth: ${maxWidth}, ratio: ${ratio}, largest: ${largest}, smallest: ${smallest}`
	)

	const calcHeight = 800 * Math.min(5, Math.max(0.35, newickNodes.length / 65))
	d3.phylogram.build('#phylogram', newick, {
		width: calcWidth,
		height: calcHeight,
		formatLeafNodeLabel: node =>
			`${node.name} [${node.ident}] (${node.length})`,
		nonmonophyly: nmResults.nm.map(pair => pair.map(node => node.ident)),
		onNodeClicked: onNodeClicked,
	})
}

function getExtremeLength(list, extreme, compare) {
	list.forEach(obj => {
		let length = obj.length
		if (length && length < extreme) {
			extreme = length
		}

		if (obj.branchset && obj.branchset.length > 0) {
			let alt = getExtremeLength(obj.branchset, extreme, compare)
			if (compare(alt, extreme)) {
				extreme = alt
			}
		}
	})

	return extreme
}

function getSmallestLength(objs) {
	let lessthan = (a, b) => a < b
	return getExtremeLength(objs, Infinity, lessthan)
}

function getLargestLength(objs) {
	let greaterthan = (a, b) => a > b
	return getExtremeLength(objs, 0, greaterthan)
}

// Whitelist is an array of individuals for a single species. Anything not
// in this whitelist must be nonmono
function findOutliers(objs, whitelist, found = []) {
	objs.forEach(obj => {
		if (obj.name && obj.name !== '' && !whitelist.includes(obj.name)) {
			found.push(`${obj.name}_${obj.length}`)
		}

		if (obj.branchset && obj.branchset.length > 0) {
			found = findOutliers(obj.branchset, whitelist, found)
		}
	})

	return found
}

function onNodeClicked(data) {
	console.log('Clicked on node point with data:', data)

	let outliers = findOutliers(data.branchset, getWhitelist())
	console.log('Outliers found:', outliers)

	outliers.forEach(outlier =>
		document.getElementById(outlier).setAttribute('fill', 'green')
	)

	alert(
		'Node analysis complete! Non-dominant species for the specified subtree are marked green. For a comprehensive list, please view the browser console logs.'
	)
}

function getWhitelist() {
	return document
		.getElementById('dominantSpeciesInput')
		.value.trim()
		.split(/,\s*/)
}
