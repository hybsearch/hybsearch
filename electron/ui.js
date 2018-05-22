'use strict'

const groupBy = require('lodash/groupBy')
const mapValues = require('lodash/mapValues')
const toPairs = require('lodash/toPairs')
const uniq = require('lodash/uniq')
const prettyMs = require('pretty-ms')
const getFiles = require('./lib/get-files')
const { attachListeners, follow } = require('./run')

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

	let [uptime, pipelines, files, jobs] = await Promise.all([
		fetchJson(baseUrl + 'uptime').then(r => r.uptime),
		fetchJson(baseUrl + 'pipelines').then(r => r.pipelines),
		fetchJson(baseUrl + 'files').then(r => r.files),
		fetchJson(baseUrl + 'jobs').then(r => r.jobs),
	])

	console.log('uptime', uptime)
	console.log('pipelines', pipelines)
	console.log('server files', files)
	console.log('jobs', jobs)

	populatePipelinePicker(pipelines, baseUrl)
	populateFilePicker(files)
	populateJobList(jobs, baseUrl)

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

const cancelJob = (id, baseUrl) =>
	fetchJson(baseUrl + `job/${id}`, { method: 'DELETE' })
const restartJob = (id, baseUrl) =>
	fetchJson(baseUrl + `job/${id}`, { method: 'POST' })

function populateJobList(jobs, baseUrl) {
	let jobsContainer = document.querySelector('#existing-jobs')

	const jobToHtml = ({
		pipeline,
		filename,
		id,
		options,
		initialClientAddress,
		duration,
		status,
	}) => {
		let li = document.createElement('li')
		li.classList.add('job')
		li.classList.add('flex-row')

		li.innerHTML = `
			<div class="info">
				<table>
					<tr><th>Pipeline</th><td>${pipeline}</td></tr>
					<tr><th>Filename</th><td>${filename}</td></tr>
					<tr><th>Status</th><td>${status}</td></tr>
					<tr><th>ID</th><td>${id}</td></tr>
					<tr><th>Options</th><td>${JSON.stringify(options, null, 2)}</td></tr>
					${duration ? `<tr><th>Duration</th><td>${prettyMs(duration)}</td></tr>` : ''}
					<tr><th>Started by</th><td>${initialClientAddress}</td></tr>
				</table>
			</div>
			<div class="buttons"></div>
		`

		let buttons = li.querySelector('.buttons')

		let followButton = document.createElement('button')
		followButton.addEventListener('click', () =>
			follow({ pipelineId: id }, { filename })
		)
		followButton.textContent = 'Follow'
		followButton.type = 'button'
		buttons.appendChild(followButton)

		let cancelButton = document.createElement('button')
		if (status === 'stopped') {
			cancelButton.addEventListener('click', () => {
				restartJob(id, baseUrl)
				fetchJson(baseUrl + 'jobs').then(r => populateJobList(r.jobs, baseUrl))
			})
			cancelButton.textContent = 'Restart'
			cancelButton.type = 'button'
			cancelButton.disabled = status !== 'stopped'
		} else {
			cancelButton.addEventListener('click', () => {
				cancelJob(id, baseUrl)
				fetchJson(baseUrl + 'jobs').then(r => populateJobList(r.jobs, baseUrl))
			})
			cancelButton.textContent = 'Stop'
			cancelButton.type = 'button'
			cancelButton.disabled = status !== 'active'
		}

		buttons.appendChild(cancelButton)

		return li
	}

	let activeJobs = jobs
		.filter(({ status }) => status === 'active')
		.map(jobToHtml)
	let inactiveJobs = jobs
		.filter(({ status }) => status !== 'active')
		.map(jobToHtml)

	let activeJobsEl = jobsContainer.querySelector('.active-jobs-list')
	let inactiveJobsEl = jobsContainer.querySelector('.inactive-jobs-list')

	activeJobsEl.innerHTML = ''
	activeJobs.forEach(node => activeJobsEl.appendChild(node))
	inactiveJobsEl.innerHTML = ''
	inactiveJobs.forEach(node => inactiveJobsEl.appendChild(node))
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
