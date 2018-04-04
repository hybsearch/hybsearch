'use strict'

const groupBy = require('lodash/groupBy')
const mapValues = require('lodash/mapValues')
const toPairs = require('lodash/toPairs')
const uniq = require('lodash/uniq')
const getFiles = require('./lib/get-files')
const { attachListeners } = require('./run')

attachListeners()

global.socket = new WebSocket(document.querySelector('#server-url').value)
initWebsocket()

function updateWebSocket(newUri) {
	console.log('new websocket', newUri)
	document.querySelector('#server-url').value = newUri
	destroyWebsocket()
	global.socket = new WebSocket(newUri)
	initWebsocket()
}

function initWebsocket() {
	global.socket.addEventListener('open', connectionIsUp)
	global.socket.addEventListener('error', connectionRefused)
}

function destroyWebsocket() {
	global.socket.removeEventListener('open', connectionIsUp)
	global.socket.removeEventListener('error', connectionRefused)
	global.socket.close()
}

document.querySelector('#use-thing3').addEventListener('click', () => {
	const newUri = document.querySelector('#use-thing3').dataset.url
	updateWebSocket(newUri)
})

document.querySelector('#use-localhost').addEventListener('click', () => {
	const newUri = document.querySelector('#use-localhost').dataset.url
	updateWebSocket(newUri)
})

document.querySelector('#server-url').addEventListener('change', ev => {
	console.log('uri changed')
	updateWebSocket(ev.currentTarget.value)
})

const getSteps = pipeline =>
	global.socket.send(
		JSON.stringify({
			type: 'pipeline-steps',
			pipeline: pipeline,
		})
	)

function connectionIsUp() {
	document.querySelector('#server-status').classList.remove('down')
	document.querySelector('#server-status').classList.add('up')

	global.socket.send(JSON.stringify({ type: 'pipeline-list' }), err => {
		if (err) {
			console.error('server error', err)
			window.alert('server error:', err.message)
		}
	})

	global.socket.addEventListener('message', ({ data }) => {
		data = JSON.parse(data)
		if (data.type === 'pipeline-list') {
			let pipelines = JSON.parse(data.payload)

			let el = document.querySelector('#pick-pipeline')
			el.innerHTML = pipelines
				.map(name => `<option value="${name}">${name}</option>`)
				.join('')

			getSteps(pipelines[0])
			el.addEventListener('change', ev => getSteps(ev.currentTarget.value))
		} else if (data.type === 'pipeline-steps') {
			let payload = JSON.parse(data.payload)

			let steps = uniq(
				payload
					.map(segment => [...segment.input, ...segment.output])
					.reduce((acc, item) => [...acc, ...item], [])
			)

			let el = document.querySelector('wrapper.loading')
			el.innerHTML = steps
				.map(
					stage =>
						`<div class="checkmark" data-loader-name="${stage}">
							<div class="icon"></div>
							<div class="label">${stage}</div>
						</div>`
				)
				.join('')
		}
	})

	global.socket.addEventListener('disconnect', (...args) =>
		console.log('disconnect', ...args)
	)

	global.socket.addEventListener('error', (...args) =>
		console.log('error', ...args)
	)
}

function connectionRefused() {
	document.querySelector('#server-status').classList.remove('up')
	document.querySelector('#server-status').classList.add('down')

	// TODO: rework connectionIsUp/connectionRefused to remove the
	// event listeners when the socket changes
}

const files = getFiles()
const groupedFiles = groupBy(files, ({ filename }) => {
	if (/\.aln/.test(filename)) {
		return 'aligned'
	}

	if (filename.endsWith('.fasta')) {
		return 'fasta'
	}

	if (filename.endsWith('.gb')) {
		return 'genbank'
	}

	return filename.split('.')[filename.split('.').length - 1]
})

const optgroups = mapValues(groupedFiles, group =>
	group.map(({ filename, filepath }) => {
		let opt = document.createElement('option')
		opt.value = filepath
		opt.textContent = filename
		return opt
	})
)

const picker = document.querySelector('#pick-file')

for (let [type, options] of toPairs(optgroups)) {
	let group = document.createElement('optgroup')
	group.label = type
	options.forEach(opt => group.appendChild(opt))
	picker.appendChild(group)
}
