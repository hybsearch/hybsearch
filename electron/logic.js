'use strict'

const Newick = require('./vendor/newick')
const d3 = require('d3')
d3.phylogram = require('./vendor/d3.phylogram')

const genbankToFasta = require('./bin/genbank-fasta')
const sanitizeFasta = require('./bin/sanitize-fasta')
const clustal = require('./bin/clustal-o')
const fastaToNexus = require('./bin/fasta-to-nexus')
const mrBayes = require('./bin/mrbayes')
const consensusTreeToNewick = require('./bin/consensus-newick')

const fs = require('fs')
const fileExt = require('file-extension')

var fileLoader = document.getElementById('load-file')
fileLoader.onchange = e => {
	e.preventDefault()
	const file = e.target.files[0]
	console.log('The file is', file.path)

	document.querySelector("section.loader").classList.add("loading")

	const delayTime = 500 // WARNING: DO NOT REMOVE; animations take time to execute

	setTimeout(function() {
		let data = fs.readFileSync(file.path, 'utf-8')
		var fasta = data;
		if (fileExt(file.path) != 'fasta') {
			fasta = genbankToFasta(data)
		} else if (data.indexOf('>gi|') > -1) {
			fasta = sanitizeFasta(data)
		}

		updateLoadingStatus(0)

		setTimeout(function() {
			const aligned = clustal(fasta)
			updateLoadingStatus(1)

			setTimeout(function() {
				const nexus = fastaToNexus(aligned)
				updateLoadingStatus(2)

				setTimeout(function() {
					const muchTree = mrBayes(nexus)
					updateLoadingStatus(3)

					setTimeout(function() {
						const newickTree = consensusTreeToNewick(muchTree)
						load(newickTree)

						updateLoadingStatus(4)
					}, delayTime) // lol
				}, delayTime)
			}, delayTime)
		}, delayTime)
	}, delayTime)

	return false
}

var treeTextButton = document.getElementById('tree-box-submit')
treeTextButton.onclick = e => {
	e.preventDefault()

	var data = document.getElementById('tree-box')

	load(data.value)
	return false
}

function updateLoadingStatus(index) {
	document.querySelector(".checkmark[data-loader-index='" + index + "']").classList.add("complete")
}

// function removeAllLoaderLoadingLoadedStatus() {
// 	document.querySelectorAll(".checkmark")
// }

function load(newickStr) {
	const newick = Newick.parse(newickStr)

	const newickNodes = []
	function buildNewickNodes(node) {
		newickNodes.push(node)
		if (node.branchset) {
			for (let i = 0; i < node.branchset.length; i++) {
				buildNewickNodes(node.branchset[i])
			}
		}
	}

	buildNewickNodes(newick)

	console.log("Got nodes:", newickNodes)

	// Scale the generated tree based on largest branch length
	const smallest = getSmallestLength(newickNodes, Infinity)
	const largest = getLargestLength(newickNodes, 0)
	const ratio = (largest / smallest) * 15
	const maxWidth = document.getElementById("phylogram").offsetWidth - 320 // Accounts for label widths
	const calcWidth = Math.max(500, Math.min(maxWidth, ratio))

	console.log("Final calcWidth: ", calcWidth, " max: ", maxWidth, " Ratio: ", ratio, " Largest: ", largest, " Smallest: ", smallest)


	const calcHeight = 800 * Math.min(5, Math.max(0.35, newickNodes.length / 65))
	d3.phylogram.build('#phylogram', newick, {
		width: calcWidth,
		height: calcHeight
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
		if (obj.name && obj.name !== "" && whitelist.indexOf(obj.name) === -1) {
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
