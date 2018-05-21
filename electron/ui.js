'use strict'

const groupBy = require('lodash/groupBy')
const mapValues = require('lodash/mapValues')
const toPairs = require('lodash/toPairs')
const uniq = require('lodash/uniq')
const getFiles = require('./lib/get-files')
const { attachListeners } = require('./run')

attachListeners()

const fetchJson = (...args) => fetch(...args).then(r => r.json())

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
	global.socket.addEventListener('close', connectionClosed)
	global.socket.addEventListener('error', connectionRefused)
}

function destroyWebsocket() {
	global.socket.removeEventListener('open', connectionIsUp)
	global.socket.removeEventListener('close', connectionClosed)
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

const getSteps = (baseUrl, pipeline) =>
	fetchJson(`${baseUrl}pipeline/${pipeline}`)

async function connectionIsUp() {
	document.querySelector('#server-status').classList.remove('down')
	document.querySelector('#server-status').classList.add('up')

	let baseUrl = global.socket.url.replace('ws:', 'http:')

	let [uptime, pipelines, files] = await Promise.all([
		fetchJson(baseUrl + 'uptime').then(r => r.uptime),
		fetchJson(baseUrl + 'pipelines').then(r => r.pipelines),
		fetchJson(baseUrl + 'files').then(r => r.files),
	])

	console.log('uptime', uptime)
	console.log('pipelines', pipelines)
	console.log('server files', files)

	populatePipelinePicker(pipelines, baseUrl)
	populateFilePicker(files, baseUrl)

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

function connectionClosed() {
	document.querySelector('#server-status').classList.remove('up')
	document.querySelector('#server-status').classList.add('down')

	Array.from(document.querySelectorAll('.checkmark.active')).forEach(node => {
		node.classList.remove('active')
		node.classList.add('error')
	})
}

function populateFilePicker(files) {
	files = files.length ? files : getFiles()

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
	picker.innerHTML = ''

	for (let [type, options] of toPairs(optgroups)) {
		let group = document.createElement('optgroup')
		group.label = type
		options.forEach(opt => group.appendChild(opt))
		picker.appendChild(group)
	}
}

function populatePipelinePicker(pipelines, baseUrl) {
	let pipelinesPicker = document.querySelector('#pick-pipeline')
	pipelinesPicker.innerHTML = pipelines
		.map(name => `<option value="${name}">${name}</option>`)
		.join('')

	getSteps(baseUrl, pipelines[0]).then(handleNewSteps)

	pipelinesPicker.addEventListener('change', ev =>
		getSteps(baseUrl, ev.currentTarget.value).then(handleNewSteps)
	)
}

const handleNewSteps = payload => {
	let steps = uniq(
		payload.steps
			.map(segment => [...segment.input, ...segment.output])
			.reduce((acc, item) => [...acc, ...item], [])
	)

	let el = document.querySelector('#loader')
	el.innerHTML = steps
		.map(
			stage =>
				`<div class="checkmark" data-loader-name="${stage}">
					<div class="icon"></div>
					<div class="label">${stage}</div>
				</div>`
		)
		.join('')

	let optionsEl = document.querySelector('#options')
	let optionsContainer = optionsEl.querySelector('.options')
	let options = Object.entries(payload.options).map(
		([key, val]) =>
			// prettier-ignore
			`<div class="option-row">
				<label>${val.label}: <input name="${key}" type="${val.type}" value="${val.default}" placeholder="${val.description}"></label>
			</div>`
	)
	if (options.length) {
		optionsEl.removeAttribute('hidden')
		optionsContainer.innerHTML = options.join('')
	} else {
		optionsEl.setAttribute('hidden', 'hidden')
		optionsContainer.innerHTML = ''
	}
}
