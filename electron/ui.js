// @ts-check
'use strict'

const groupBy = require('lodash/groupBy')
const mapValues = require('lodash/mapValues')
const toPairs = require('lodash/toPairs')
const getFiles = require('./get-files')
const run = require('./run')

let websocket = new WebSocket(document.querySelector('#server-url').value)
initWebsocket()

function updateWebSocket(newUri) {
	console.log('new websocket', newUri)
	document.querySelector('#server-url').value = newUri
	destroyWebsocket()
	websocket = new WebSocket(newUri)
	initWebsocket()
}

function initWebsocket() {
	websocket.addEventListener('open', connectionIsUp)
	websocket.addEventListener('error', connectionRefused)
}

function destroyWebsocket() {
	websocket.removeEventListener('open', connectionIsUp)
	websocket.removeEventListener('error', connectionRefused)
	websocket.close()
}

document.querySelector('#start').addEventListener('click', () => run(websocket))

document.querySelector('#use-thing3').addEventListener('click', () => {
	const newUri = document.querySelector('#use-thing3').dataset.url
	updateWebSocket(newUri)
})

document.querySelector('#use-localhost').addEventListener('click', () => {
	const newUri = document.querySelector('#use-localhost').dataset.url
	updateWebSocket(newUri)
})

document.querySelector('#server-url').addEventListener('change', (ev) => {
	console.log('uri changed')
	updateWebSocket(ev.currentTarget.value)
})

function connectionIsUp() {
	document.querySelector('#server-status').classList.remove('down')
	document.querySelector('#server-status').classList.add('up')
}

function connectionRefused() {
	document.querySelector('#server-status').classList.remove('up')
	document.querySelector('#server-status').classList.add('down')
}

const files = getFiles()
const groupedFiles = groupBy(files, f => {
	if (/\.aln/.test(f)) {
		return 'aligned'
	}

	if (f.endsWith('.fasta')) {
		return 'fasta'
	}

	if (f.endsWith('.gb')) {
		return 'genbank'
	}

	return f.split('.')[f.split('.').length - 1]
})

const optgroups = mapValues(groupedFiles, (group, groupedBy) =>
	group.map(filename => {
		let opt = document.createElement('option')
		opt.value = filename
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

document.querySelector('#reload').addEventListener('click', () => {
	window.location.reload()
})
