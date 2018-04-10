'use strict'

const { load, setEntResults } = require('./graph')
const prettyMs = require('pretty-ms')
const fs = require('fs')
const toPairs = require('lodash/toPairs')

function run() {
	// get the file
	let filepicker = document.querySelector('#load-file')
	let filedropdown = document.querySelector('#pick-file')
	let filepath = filepicker.files.length
		? filepicker.files[0].path
		: filedropdown.value

	console.log(`The file is ${filepath}`)
	const data = fs.readFileSync(filepath, 'utf-8')

	// start the loading bar
	document.querySelector('section.loader').classList.add('loading')

	// get the chosen pipeline name
	let pipeline = document.querySelector('#pick-pipeline').value

	// start the pipeline
	submitJob({ pipeline, filepath, data })

	return false
}

function submitJob({ socket = global.socket, pipeline, filepath, data }) {
	const ws = socket

	ws.addEventListener('message', packet => onMessage(packet.data))
	ws.addEventListener('disconnect', (...args) =>
		console.log('disconnect', ...args)
	)
	ws.addEventListener('error', (...args) => console.log('error', ...args))
	ws.addEventListener('exit', (...args) => console.log('exit', ...args))

	if (ws.readyState !== 1) {
		throw new Error('socket not ready!')
	}

	let payload = { type: 'start', pipeline, filepath, data }
	ws.send(JSON.stringify(payload), err => {
		if (err) {
			console.error('server error', err)
			window.alert('server error:', err.message)
		}
	})
}

function makeTableFromObject(data) {
	let table = document.createElement('table')

	let thead = document.createElement('thead')
	let tr = document.createElement('tr')

	let first = data[0]
	if (!first) {
		return table
	}

	for (let comparison of Object.keys(first)) {
		let th = document.createElement('th')
		th.innerHTML = comparison
		tr.appendChild(th)
	}

	thead.appendChild(tr)
	table.appendChild(thead)

	let tbody = document.createElement('tbody')
	for (let distribution of data) {
		let tr = document.createElement('tr')

		if (distribution.__highlight) {
			tr.classList.add('highlight')
		}

		let values = toPairs(distribution)
			.filter(([key]) => !key.startsWith('__'))
			.map(([_, value]) => value)

		for (let value of values) {
			let td = document.createElement('td')
			td.innerHTML = value
			tr.appendChild(td)
		}

		tbody.appendChild(tr)
	}

	table.appendChild(tbody)

	return table
}

function onData(phase, data) {
	console.info([phase, data])
	if (phase.startsWith('newick-json:')) {
		// Once we get the parsed newick tree, we can render the tree while
		// the pipeline continues
		document.querySelector('#phylogram').hidden = false
		load(data)
	} else if (phase === 'pruned-identifiers') {
		let container = document.querySelector('#omitted-container')
		let results = document.querySelector("#omitted-results")

		let formattedNames = data.map(node => {
			let ident = node.ident ? ` [${node.ident}]` : ''
			return `${node.name}${ident} (${node.length})`
		})

		results.innerHTML = `<pre>${formattedNames.join('\n')}</pre>`
		container.hidden = false
	} else if (phase === 'jml-output') {
		let container = document.querySelector('#jml-container')

		document
			.querySelector('#distributions')
			.appendChild(makeTableFromObject(data.distributions))

		document
			.querySelector('#probabilities')
			.appendChild(makeTableFromObject(data.probabilities))

		data.results = data.results.map(item => {
			if (item.Probability < 0.05) {
				return Object.assign({}, item, { __highlight: true })
			}
			return item
		})
		document
			.querySelector('#results')
			.appendChild(makeTableFromObject(data.results))

		container.hidden = false
	} else if (phase === 'nonmonophyletic-sequences') {
		setEntResults(data)
	} else {
		console.warn(`Client doesn't understand data for "${phase}"`)
	}
}

function onMessage(packet) {
	let { type, payload } = JSON.parse(packet)

	if (type === 'stage-start') {
		const { stage } = payload
		beginLoadingStatus(stage)
	} else if (type === 'stage-complete') {
		const { stage, timeTaken, result, cached } = payload
		updateLoadingStatus({
			label: stage,
			duration: timeTaken,
			usedCache: cached,
		})
		onData(stage, result)
	} else if (type === 'error') {
		let { error, timeTaken } = payload
		console.error(error)
		setLoadingErrors({ after: timeTaken })
		document.querySelector('#error-container').hidden = false
		document.querySelector('#error-message').innerText = error.message
	} else if (type === 'exit') {
		console.info('server exited')
	} else {
		console.warn(`unknown cmd "${type}"`)
	}
}

function attachListeners() {
	document.getElementById('tree-box-submit').addEventListener('click', e => {
		e.preventDefault()

		let data = document.getElementById('tree-box').value
		submitJob({ pipeline: 'parse-newick', filepath: 'input.newick', data })
	})

	document
		.getElementById('json-tree-box-submit')
		.addEventListener('click', e => {
			e.preventDefault()

			let data = document.getElementById('tree-box').value
			load(JSON.parse(data))
		})

	document.getElementById('start').addEventListener('click', e => {
		e.preventDefault()

		run()
	})

	document.getElementById('reload').addEventListener('click', e => {
		e.preventDefault()

		window.location.reload()
	})
}

function updateLoadingStatus({ label, duration, usedCache }) {
	console.info(`finished ${label} in ${duration}ms`)
	let el = document.querySelector(`.checkmark[data-loader-name='${label}']`)
	if (!el) {
		console.error(`could not find .checkmark[data-loader-name='${label}']`)
		return
	}
	el.classList.remove('active')
	el.classList.add('complete')
	usedCache && el.classList.add('used-cache')
	el.dataset.time = prettyMs(duration)
}

function beginLoadingStatus(label) {
	console.info(`beginning ${label}`)
	let el = document.querySelector(`.checkmark[data-loader-name='${label}']`)
	if (!el) {
		console.error(`could not find .checkmark[data-loader-name='${label}']`)
		return
	}
	el.classList.add('active')
}

function setLoadingErrors({ after: timeTaken }) {
	let els = document.querySelectorAll(`.checkmark.active`)
	for (let el of els) {
		console.info(`error in ${el.dataset.loaderName}`)
		el.classList.add('error')
		el.dataset.time = prettyMs(timeTaken)
	}
}

module.exports = run
module.exports.attachListeners = attachListeners
