'use strict'

const parseNewick = require('./vendor/newick').parse
const d3 = require('d3')
const path = require('path')
d3.phylogram = require('./vendor/d3.phylogram')
const childProcess = require('child_process')
require('./vendor/array.proto.includes')

function loadAndProcessData(e) {
	let file = e.target.files[0]
	console.log('The file is', file.path)

	document.querySelector('section.loader').classList.add('loading')

	let start = performance.now()
	let child = childProcess.fork(path.join('.', 'worker.js'), {
		silent: true,
	})

	// still doesn't work.
	// current problem: the calls to execSync in `child`s children
	// don't get the signal.
	let killChildProcess = () => child.kill()
	process.on('exit', killChildProcess)
	window.addEventListener('beforeunload', killChildProcess)

	let currentLabel
	child.on('message', packet => {
		let [cmd, msg] = packet
		if (cmd === 'complete') {
			let taken = performance.now() - start
			updateLoadingStatus(msg, taken.toFixed(2))
		}
		else if (cmd === 'begin') {
			start = performance.now()
			currentLabel = msg
			beginLoadingStatus(msg)
		}
		else if (cmd === 'finish') {
			load(parseNewick(msg))
		}
		else if (cmd === 'exit' || cmd === 'error') {
			if (cmd === 'error') {
				console.error(msg)
				let taken = performance.now() - start
				setLoadingError(currentLabel, taken.toFixed(2))
			}
			child.disconnect()
		}
		else {
			throw new Error(`unknown cmd "${cmd}"`)
		}
	})

	child.send(file.path, err => {
		if (err) {
			console.error('child error', err)
		}
	})

	return false
}

var fileLoader = document.getElementById('load-file')
fileLoader.addEventListener('change', loadAndProcessData)

var treeTextButton = document.getElementById('tree-box-submit')
treeTextButton.addEventListener('click', e => {
	e.preventDefault()
	var data = document.getElementById('tree-box').value
	load(parseNewick(data))
})

var jsontreeTextButton = document.getElementById('json-tree-box-submit')
jsontreeTextButton.addEventListener('click', e => {
	e.preventDefault()
	let data = document.getElementById('tree-box').value
	load(JSON.parse(data))
})

function updateLoadingStatus(label, timeTaken) {
	console.info(`finished ${label} in ${timeTaken}ms`)
	let el = document.querySelector(`.checkmark[data-loader-name='${label}']`)
	el.classList.remove('active')
	el.classList.add('complete')
	el.dataset.time = timeTaken
}

function showTime(ms) {
	console.info(`completed in ${ms} ms`)
	document.querySelector(`.time-taken`).textContent = `${ms}ms`
}

function beginLoadingStatus(label) {
	console.info(`beginning ${label}`)
	document.querySelector(`.checkmark[data-loader-name='${label}']`).classList.add('active')
}

function setLoadingError(label, timeTaken) {
	console.info(`error in ${label} (after ${timeTaken}ms)`)
	let el = document.querySelector(`.checkmark[data-loader-name='${label}']`)
	el.classList.add('error')
	el.dataset.time = timeTaken
}

function load(newick) {
	const newickNodes = []
	function buildNewickNodes(node) {
		newickNodes.push(node)
		if (node.branchset) {
			node.branchset.forEach(n => buildNewickNodes(n))
		}
	}

	buildNewickNodes(newick)

	console.log('Got nodes:', newickNodes)

	// Scale the generated tree based on largest branch length
	const smallest = getSmallestLength(newickNodes)
	const largest = getLargestLength(newickNodes)
	const ratio = (largest / smallest) * 15
	const maxWidth = document.getElementById('phylogram').offsetWidth - 320 // Accounts for label widths
	const calcWidth = Math.max(500, Math.min(maxWidth, ratio))

	console.log(`Final calcWidth: ${calcWidth}, maxWidth: ${maxWidth}, ratio: ${ratio}, largest: ${largest}, smallest: ${smallest}`)

	const calcHeight = 800 * Math.min(5, Math.max(0.35, newickNodes.length / 65))
	d3.phylogram.build('#phylogram', newick, {
		width: calcWidth,
		height: calcHeight,
	})
}

function getExtremeLength(list, extreme, comp) {
	list.forEach(obj => {
		let length = obj.length
		if (length && length < extreme) {
			extreme = length
		}

		if (obj.branchset && obj.branchset.length > 0) {
			let alt = getExtremeLength(obj.branchset, extreme, comp)
			if (comp(alt, extreme)) {
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
function findOutliers(objs, whitelist, found) {
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

	let outliers = findOutliers(data.branchset, getWhitelist(), [])
	console.log('Outliers found:', outliers)

	outliers.forEach(outlier => {
		document.getElementById(outlier).setAttribute('fill', 'green')
	})

	alert('Node analysis complete! Non-dominant species for the specified subtree are marked green. For a comprehensive list, please view the browser console logs.')
}

function getWhitelist() {
	return document.getElementById('dominantSpeciesInput').value.trim().split(/,\s*/)
}
