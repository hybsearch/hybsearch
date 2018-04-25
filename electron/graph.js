'use strict'

const makeTableFromObjectList = require('./lib/html-table')
const d3 = require('d3')
d3.phylogram = require('./lib/d3.phylogram')

let nmResults
let newick
let newickNodes

function formatEnt(results) {
	return results.nm.map(pair => {
		let [nonmonophyly, other] = pair.map(node => `${node.name} (${node.ident})`)
		return { nonmonophyly, other }
	})
}

module.exports.setEntResults = setEntResults
function setEntResults(results) {
	nmResults = results
	console.log('Got ent!', results)
	let non =
		nmResults !== undefined
			? nmResults.nm.map(pair => pair.map(node => node.ident))
			: null
	console.log(non)

	if (non) {
		let formattedReslults = formatEnt(nmResults)
		document
			.querySelector('#nonmonophyly-results')
			.appendChild(makeTableFromObjectList(formattedReslults))
		document.querySelector('#nm-container').hidden = false
	} else {
		console.warn('no nonmonophyly object')
	}

	// Re-render with the nmResults, assuming newick and newickNodes have already been processed
	render(newick, newickNodes, nmResults)
}

module.exports.load = load
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

	window.addEventListener('optimizedResize', function() {
		render(newick, newickNodes, nmResults)
	})
}

function render(newickData, newickNodes, nmResults) {
	let el = document.querySelector('#phylogram')
	if (el) {
		el.innerHTML = ''
	}

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
			// console.log(node)
			return `${name} [${node.ident}] (${node.length})`
		},
		nonmonophyly: nmResults
			? nmResults.nm
					.filter(pair => pair)
					.map(pair => pair.map(node => node.ident))
			: null,
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

function toggleMuteLeaves({ doMute }) {
	const nodes = document.querySelectorAll('.node.leaf')
	for (let node of nodes) {
		if (doMute) {
			node.classList.add('muted')
		} else {
			node.classList.remove('muted')
		}
	}
}

function onNodeClicked(data) {
	if (data.name === '' || !nmResults) {
		// We don't care about anything that's not a leaf node
		return
	}

	// Find the other individual that is nonmonophyletic with this one
	let nonMonoPair
	for (let pair of nmResults.nm) {
		if (pair[0].ident === data.ident) {
			nonMonoPair = pair[1]
			break
		}
		if (pair[1].ident === data.ident) {
			nonMonoPair = pair[0]
			break
		}
	}

	// Now let's toggle the non-mono pair green if one was found
	if (nonMonoPair) {
		// If it's already muted, toggle all off
		let nodeSVG = document.querySelector(`[data-ident='${data.ident}']`)
		let pairSVG = document.querySelector(`[data-ident='${nonMonoPair.ident}']`)
		if (document.querySelector('.node.leaf.muted')) {
			toggleMuteLeaves({ doMute: false })
		} else {
			// First we set all nodes to muted
			toggleMuteLeaves({ doMute: true })
			// Except for the one and its pair
			nodeSVG.classList.remove('muted')
			pairSVG.classList.remove('muted')

			const p1 = `${data.name}${data.ident}`
			const p2 = `${nonMonoPair.name}${nonMonoPair.ident}`
			alert(`${p1} is nonmono with ${p2}`)
		}
	} else {
		toggleMuteLeaves({ doMute: false })
		alert('This node is not monophyletic!')
	}
}

// this next block taken from MDN
;(function() {
	let throttle = function(type, name, obj) {
		obj = obj || window
		let running = false
		let func = function() {
			if (running) {
				return
			}
			running = true
			requestAnimationFrame(function() {
				obj.dispatchEvent(new CustomEvent(name))
				running = false
			})
		}
		obj.addEventListener(type, func)
	}

	/* init - you can init any event */
	throttle('resize', 'optimizedResize')
})()
