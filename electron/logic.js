'use strict'

var tree

const Newick = require('./vendor/newick')
const d3 = require('d3')
d3.phylogram = require('./vendor/d3.phylogram')

const genbankToFasta = require('./genbank-to-fasta')
const clearcut = require('./clearcut')
const clustal = require('./clustal')

const fs = require('fs')

var fileLoader = document.getElementById('load-file')
fileLoader.onchange = e => {
	e.preventDefault()
	const file = e.target.files[0]

	console.log('The file is', file.path)

	const fasta = genbankToFasta(fs.readFileSync(file.path, 'utf-8'))
	const aligned = clustal(fasta, '.aln')
	const tree = clearcut(aligned, '.ph')

	load(tree)
	return false
}

var treeTextButton = document.getElementById('tree-box-submit')
treeTextButton.onclick = e => {
	e.preventDefault()

	var data = document.getElementById('tree-box')

	load(data.value)
	return false
}

function load(newickStr) {
	const newick = Newick.parse(newickStr)

	const newickNodes = []
	function buildNewickNodes(node, callback) {
		newickNodes.push(node)
		if (node.branchset) {
			for (let i = 0; i < node.branchset.length; i++) {
				buildNewickNodes(node.branchset[i])
			}
		}
	}

	buildNewickNodes(newick)

	console.log("Got nodes:", newickNodes)
	tree = newickNodes

	// Find the min and max to calc width
	const smallest = getSmallestLength(newickNodes, Infinity)
	const largest = getLargestLength(newickNodes, 0)
	const ratio = (largest/smallest)
	console.log("Width ratio is", ratio)

	d3.phylogram.build('#phylogram', newick, {
		width: 10 * ratio,
		height: 800
	})
}

function getSmallestLength(objs, smallest) {
	for (let obj of objs) {
		let length = obj.length
		if (length && length < smallest) {
			smallest = length
		}

		if (obj.branchset && obj.branchset.length > 0) {
			let sub = getSmallestLength(obj.branchset, smallest)
			if (sub < smallest) {
				smallest = sub
			}
		}
	}

	return smallest
}

function getLargestLength(objs, largest) {
	for (let obj of objs) {
		let length = obj.length
		if (length && length > largest) {
			largest = length
		}

		if (obj.branchset && obj.branchset.length > 0) {
			let sub = getLargestLength(obj.branchset, largest)
			if (sub > largest) {
				largest = sub
			}
		}
	}

	return largest
}

// Whitelist is an array of individuals for a single species. Anything not
// in this whitelist must be nonmono
function findOutliers(objs, whitelist, found) {
	for (let obj of objs) {
		if (obj.name && obj.name != "" && whitelist.indexOf(obj.name) == -1) {
			found.push(obj.name + "_" + obj.length)
		}

		if (obj.branchset && obj.branchset.length > 0) {
			found = findOutliers(obj.branchset, whitelist, found)
		}
	}

	return found
}

function onNodeClicked(data) {
	console.log("##Clicked on node point with data: ", data)

	let outliers = findOutliers(data.branchset, getWhitelist(), [])
	console.log("##Outliers found:", outliers)

	for (let outlier of outliers) {
		document.getElementById(outlier).setAttribute("fill", "green")
	}

	alert("Node analysis complete! Non-dominant species for the specified subtree are marked green. For a comprehensive list, please view the browser console logs.")
}

function getWhitelist() {
	return document.getElementById("dominantSpeciesInput").value.trim().split(/,\s*/)
}
