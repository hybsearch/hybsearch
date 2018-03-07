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

let nodesMuted = false;

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

function ToggleMuteLeaves(doMute){
	var nodes = document.querySelectorAll(".node.leaf")
	nodesMuted = doMute
	for(var i=0;i<nodes.length;i++){
		var node = nodes[i];
		var isMuted = node.className.baseVal.indexOf("muted") != -1;
		if(doMute && !isMuted){
			node.className.baseVal += " muted"
		}
		if(!doMute && isMuted){
			node.className.baseVal = node.className.baseVal.replace("muted","")
		}
		
	}
}

function onNodeClicked(data) {
	if(data.name == "" || nmResults == undefined)
		return; // We don't care about anything that's not a leaf node
	// Find the other individual that is nonmonophyletic with this one
	var nonmono_pair;
	for(var i=0;i<nmResults.nm.length;i++){
		var pair = nmResults.nm[i];
		if(pair[0].ident == data.ident){
			nonmono_pair = pair[1];
			break;
		}
		if(pair[1].ident == data.ident){
			nonmono_pair = pair[0];
			break;
		}
	}
	// Now let's toggle the non-mono pair green if one was found

	if(nonmono_pair){
		// If it's already muted, toggle all off 
		var nodeSVG = document.querySelector("[data-ident='"+data.ident+"']")
		var pairSVG = document.querySelector("[data-ident='"+nonmono_pair.ident+"']")
		if(nodesMuted){
			ToggleMuteLeaves(false)
		} else {
			// First we set all nodes to muted
			ToggleMuteLeaves(true);
			// Except for the one and its pair 
			nodeSVG.className.baseVal = nodeSVG.className.baseVal.replace("muted","")
			pairSVG.className.baseVal = pairSVG.className.baseVal.replace("muted","")

			alert(data.name + data.ident + " is nonmono with " + nonmono_pair.name + nonmono_pair.ident)
		}
	} else {
		ToggleMuteLeaves(false);
		alert("This node is not monophyletic!")
	}
	

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
