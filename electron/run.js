'use strict'

const { load, setEntResults } = require('./graph')
const makeTableFromObjectList = require('./lib/html-table')
const prettyMs = require('pretty-ms')
const publicIp = require('public-ip')
const fs = require('fs')
const fromPairs = require('lodash/fromPairs')

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
	let loader = document.querySelector('#loader')
	loader.classList.add('loading')
	loader.hidden = false

	// hide the input boxes
	document.querySelector('#file-input').hidden = true
	document.querySelector('#existing-jobs').hidden = true
	document.querySelector('#newick-input').hidden = true

	// get the chosen pipeline name
	let pipeline = document.querySelector('#pick-pipeline').value

	// get the pipeline options
	let options = document.querySelector('#options .options')
	let opts = Array.from(options.elements).map(el => [
		el.name,
		el.type === 'number' ? Number(el.value) : el.value,
	])
	opts = fromPairs(opts)

	// start the pipeline
	submitJob({ pipeline, filepath, data, options: opts })

	return false
}

async function submitJob({
	socket = global.socket,
	pipeline,
	filepath,
	data,
	options,
}) {
	const ws = socket
	const ip = (await publicIp.v6()) || (await publicIp.v4())

	ws.addEventListener('message', packet => onMessage(packet.data))
	ws.addEventListener('disconnect', (...args) =>
		console.log('disconnect', ...args)
	)
	ws.addEventListener('error', (...args) => console.log('error', ...args))
	ws.addEventListener('exit', (...args) => console.log('exit', ...args))

	if (ws.readyState !== 1) {
		throw new Error('socket not ready!')
	}

	let payload = {
		type: 'start-pipeline',
		pipeline,
		filepath,
		data,
		options,
		ip,
	}
	ws.send(JSON.stringify(payload), err => {
		if (err) {
			console.error('server error', err)
			window.alert('server error:', err.message)
		}
	})
}

function followJob({ socket = global.socket, pipelineId }) {
	let loader = document.querySelector('#loader')
	loader.classList.add('loading')
	loader.hidden = false

	document.querySelector('#file-input').hidden = true
	document.querySelector('#existing-jobs').hidden = true
	document.querySelector('#newick-input').hidden = true

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

	let payload = { type: 'follow-pipeline', id: pipelineId }
	ws.send(JSON.stringify(payload), err => {
		if (err) {
			console.error('server error', err)
			window.alert('server error:', err.message)
		}
	})
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

		let formattedNames = data.map(node => {
			let ident = node.ident ? ` [${node.ident}]` : ''
			return { node: `${node.name}${ident} (${node.length})` }
		})

		if (formattedNames.length > 0) {
			container.hidden = false
			container.appendChild(makeTableFromObjectList(formattedNames))
		}
	} else if (phase === 'jml-output') {
		let container = document.querySelector('#jml-container')
		container.hidden = false

		document
			.querySelector('#distributions')
			.appendChild(makeTableFromObjectList(data.distributions))

		document
			.querySelector('#probabilities')
			.appendChild(makeTableFromObjectList(data.probabilities))

		data.results = data.results.map(item => {
			if (item.Probability < 0.05) {
				return Object.assign({}, item, { __highlight: true })
			}
			return item
		})
		document
			.querySelector('#results')
			.appendChild(makeTableFromObjectList(data.results))
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
			result: result,
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
			document.querySelector('#phylogram').hidden = false
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

function makeDetailsSection(title, data) {
	let details = document.createElement('details')

	let summary = document.createElement('summary')
	let heading = document.createElement('h2')
	heading.textContent = title
	summary.appendChild(heading)
	details.appendChild(summary)

	let content = document.createElement('pre')
	content.classList.add('preformatted')
	content.textContent = data

	details.appendChild(content)
	return details
}

function formatResult(phase, data) {
	if (phase === 'beast-trees') {
		let wrapper = document.createElement('div')

		wrapper.appendChild(makeDetailsSection('log', data.log))
		wrapper.appendChild(makeDetailsSection('species', data.species))
		wrapper.appendChild(makeDetailsSection('trees', data.trees))

		return wrapper
	}

	if (phase === 'jml-output') {
		let wrapper = document.createElement('div')

		let distributions = JSON.stringify(data.distributions, null, 2)
		wrapper.appendChild(makeDetailsSection('distributions', distributions))
		let probabilities = JSON.stringify(data.probabilities, null, 2)
		wrapper.appendChild(makeDetailsSection('probabilities', probabilities))
		let results = JSON.stringify(data.results, null, 2)
		wrapper.appendChild(makeDetailsSection('results', results))

		return wrapper
	}

	if (phase === 'nonmonophyletic-sequences') {
		let wrapper = document.createElement('div')

		let species = JSON.stringify(data.species, null, 2)
		wrapper.appendChild(makeDetailsSection('species', species))
		let nm = JSON.stringify(data.nm, null, 2)
		wrapper.appendChild(makeDetailsSection('nm', nm))

		return wrapper
	}

	let dataEl = document.createElement('pre')
	dataEl.classList.add('preformatted')

	if (typeof data !== 'string') {
		dataEl.textContent = JSON.stringify(data, null, 2)
		return dataEl
	}

	dataEl.textContent = data
	return dataEl
}

function createResultsDialog(node, result, stage) {
	let dialog = document.createElement('dialog')
	dialog.classList.add('pinned')

	let data = formatResult(stage, result)
	dialog.appendChild(data)

	let buttons = document.createElement('menu')
	let closeButton = document.createElement('button')
	closeButton.type = 'reset'
	closeButton.textContent = 'Close'
	closeButton.addEventListener('click', ev => {
		ev.preventDefault()
		ev.stopPropagation()
		dialog.close()
	})
	buttons.appendChild(closeButton)
	dialog.appendChild(buttons)

	dialog.addEventListener('click', ev => {
		ev.stopPropagation()
	})

	node.appendChild(dialog)

	return dialog
}

function updateLoadingStatus({ label, duration, usedCache, result }) {
	console.info(`finished ${label} in ${duration}ms`)
	let el = document.querySelector(`.checkmark[data-loader-name='${label}']`)
	if (!el) {
		console.error(`could not find .checkmark[data-loader-name='${label}']`)
		return
	}
	el.classList.remove('active')
	el.classList.add('complete')

	let dialog = el.querySelector('dialog')
	if (!dialog) {
		dialog = createResultsDialog(el, result, label)

		el.addEventListener('click', ev => {
			ev.preventDefault()
			dialog.showModal()
		})
	}

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
module.exports.follow = followJob
module.exports.attachListeners = attachListeners
