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

function RemoveNodes(node,identArray) {
	if (node.branchset) {
		let new_branchset = []
		for(let child of node.branchset) {
			let include = true;

			if(!child.branchset){
				if((child.ident && identArray.indexOf(child.ident) != -1) || (identArray.indexOf(child.name) != -1)){
					include = false;
				}
			}
			if(include){
				new_branchset.push(child)
			}

			RemoveNodes(child,identArray)
		}

		node.branchset = new_branchset
	}
}

function RemoveRedundant(node){
	// If a node points to just one branch, go down until you hit 
	// something that's either a leaf or just more than one branch, and set that to be 
	// the thing it points to 
	if(node.branchset && node.branchset.length == 1 && node.branchset[0].branchset){
		return RemoveRedundant(node.branchset[0])
	} else {
		let new_branchset = []
		for(let child of node.branchset) {
			if(child.branchset && child.branchset.length == 1 && child.branchset[0].branchset){
				child = RemoveRedundant(child)
			}

			new_branchset.push(child)
		}
		node.branchset = new_branchset

		return node
	}
}



function setEntResults(results){
	nmResults = results
	let non = (nmResults !== undefined) ? nmResults.nm.map(pair => pair.map(node => node.ident)) : null
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
	/////////////////
	let leafNodes = []
	function GetLeaves(node) {
		if (node.branchset) {
			node.branchset.forEach(GetLeaves)
		} else {
			leafNodes.push(node)
		}
	}
	// Compute average lengths of the nodes
	GetLeaves(newick)
	let average = 0;
	for(let leaf of leafNodes) {
		average += leaf.length
	}
	average /= leafNodes.length
	// Compute standard deviation 
	let std = 0;
	for(let leaf of leafNodes) {
		std += Math.pow((leaf.length - average),2)
	}
	std /= leafNodes.length
	std = Math.sqrt(std)
	// If a value's diff from the mean is larger than 2 * std, then chuck it
	let toRemoveNames = []
	let toRemoveNodes = []
	for(let leaf of leafNodes) {
		let min = average - std * 2; 
		let max = average + std * 2; 
		if(leaf.length < min || leaf.length > max){
			if(leaf.ident){
				toRemoveNames.push(leaf.ident)
			} else {
				toRemoveNames.push(leaf.name)
			}

			toRemoveNodes.push(leaf)
		}

	}
	// Now remove the nodes 
	if(toRemoveNodes.length != 0){
		document.querySelector('#omitted-container').hidden = false
		document.querySelector('#standard-deviation').innerHTML = (std * 2).toFixed(2)
		let resultsEl = document.querySelector('#omitted-results')
		resultsEl.innerHTML = '<pre>'
		for(let node of toRemoveNodes){
			let name = node.name; 
			if(node.ident){
				name += `[${node.ident}]`;
			}
			resultsEl.innerHTML += String(name) + " (" + String(node.length) + ")"
			resultsEl.innerHTML += '\n'
		}
		resultsEl.innerHTML += '</pre>'
		RemoveNodes(newick,toRemoveNames)
		newick = RemoveRedundant(newick)
		delete newick.length;
		newickNodes = []
		buildNewickNodes(newick)
	}
	
	///////////////////
	

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
