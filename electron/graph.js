// @ts-check
'use strict'

const d3 = require('d3')
d3.phylogram = require('../vendor/d3.phylogram')

const ent = require('../lib/ent')
module.exports.load = load
module.exports.setEntResults = setEntResults

let nmResults
let newick
let newickNodes

function setEntResults(results){
	nmResults = results
	console.log("Got ent!",results)
	let non = (nmResults !== undefined) ? nmResults.nm.map(pair => pair.map(node => node.ident)) : null
	console.log(non)
	let formattedReslults = ent.formatData(nmResults)
	let resultsEl = document.querySelector('#nonmonophyly-results')
	resultsEl.innerHTML = `<pre>${formattedReslults}</pre>`
	document.querySelector('#nm-container').hidden = false

	// Re-render with the nmResults, assuming newick and newickNodes have already been processed
	let el = document.querySelector('#phylogram')
	if (el) el.innerHTML = ''
	render(newick, newickNodes, nmResults)
}

function load(newickData) {
	newick = newickData
	newickNodes = []
	function buildNewickNodes(node) {
		newickNodes.push(node)
		if (node.branchset) {
			node.branchset.forEach(buildNewickNodes)
		}
	}

	buildNewickNodes(newick)

	render(newick, newickNodes, nmResults)

	window.addEventListener("optimizedResize", function() {
		let el = document.querySelector('#phylogram')
		if (el) el.innerHTML = ''
		render(newick, newickNodes, nmResults)
	});
}

function render(newickData, newickNodes, nmResults) {
	// nmResults is optional. If not passed, tree will be drawn with no marked nodes.
	// This is to allow the tree to be drawn while the ent search goes on. 

	// Scale the generated tree based on largest branch length
	const smallest = getSmallestLength(newickNodes)
	const largest = getLargestLength(newickNodes)
	const ratio = largest / smallest * 15
	const maxWidth = document.getElementById('phylogram').offsetWidth - 420 // Accounts for label widths
	const calcWidth = Math.max(500, Math.min(maxWidth, ratio))

	console.log(
		`Final calcWidth: ${calcWidth}, maxWidth: ${maxWidth}, ratio: ${ratio}, largest: ${largest}, smallest: ${smallest}`
	)

	const calcHeight = 800 * Math.min(5, Math.max(0.35, newickNodes.length / 65))
	d3.phylogram.build('#phylogram', newickData, {
		width: maxWidth,
		height: calcHeight,
		formatLeafNodeLabel: node => {
			let name = node.name.replace(/_/g, ' ')
			console.log(node)
			return `${name} [${node.ident}] (${node.length})`
		},
		nonmonophyly: (nmResults !== undefined) ? nmResults.nm.map(pair => pair.map(node => node.ident)) : null,
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


// this next block taken from MDN
(function() {
    var throttle = function(type, name, obj) {
        obj = obj || window;
        var running = false;
        var func = function() {
            if (running) { return; }
            running = true;
             requestAnimationFrame(function() {
                obj.dispatchEvent(new CustomEvent(name));
                running = false;
            });
        };
        obj.addEventListener(type, func);
    };

    /* init - you can init any event */
    throttle("resize", "optimizedResize");
})();
