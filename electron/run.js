// @ts-check
'use strict'

const {parse: parseNewick} = require('../vendor/newick')
const {load} = require('./graph')

const childProcess = require('child_process')
const path = require('path')

module.exports = run
function run() {
	let filepicker = document.querySelector('#load-file')
	let filedropdown = document.querySelector('#pick-file')
	let filepath = filepicker.files.length
		? filepicker.files[0].path
		: path.join(__dirname, '..', 'data', filedropdown.value)

	console.log('The file is', filepath)

	document.querySelector('section.loader').classList.add('loading')

	let mutableArgs = {
		start: performance.now(),
		label: 'process',
	}
	let child = childProcess.fork(path.join(__dirname, '..', 'lib', 'worker.js'))

	// still doesn't work.
	// current problem: the calls to execSync in `child`s children
	// don't get the signal.
	let killChildProcess = () => child.kill()
	process.on('exit', killChildProcess)
	window.addEventListener('beforeunload', killChildProcess)

	child.on('message', packet => onMessage(packet, mutableArgs, child))
	child.on('disconnect', console.log.bind(console, 'disconnect'))
	child.on('error', console.log.bind(console, 'error'))
	child.on('exit', console.log.bind(console, 'exit'))

	child.send(filepath, err => {
		if (err) {
			console.error('child error', err)
		}
	})

	return false
}

function onMessage(packet, args, child) {
	let [cmd, msg] = packet
	switch (cmd) {
		case 'begin': {
			args.start = performance.now()
			args.label = msg
			beginLoadingStatus(msg)
			break
		}
		case 'complete': {
			let taken = performance.now() - args.start
			updateLoadingStatus(msg, taken.toFixed(2))
			break
		}
		case 'error': {
			console.error(msg)
			let taken = performance.now() - args.start
			setLoadingError(args.label, taken.toFixed(2))
			child.disconnect()
			break
		}
		case 'exit': {
			child.disconnect()
			break
		}
		case 'finish': {
			load(parseNewick(msg))
			break
		}
		default: {
			throw new Error(`unknown cmd "${cmd}"`)
		}
	}
}

document.getElementById('tree-box-submit').addEventListener('click', e => {
	e.preventDefault()
	var data = document.getElementById('tree-box').value
	load(parseNewick(data))
})

document.getElementById('json-tree-box-submit').addEventListener('click', e => {
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
