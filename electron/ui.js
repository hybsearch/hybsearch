// @ts-check
'use strict'

const groupBy = require('lodash/groupBy')
const mapValues = require('lodash/mapValues')
const toPairs = require('lodash/toPairs')
const getFiles = require('./get-files')
const run = require('./run')

document.querySelector('#start').addEventListener('click', () => {
	const server = document.querySelector('#server-url').value
	run(server)
})

document.querySelector('#use-thing3').addEventListener('click', () => {
	document.querySelector('#server-url').value = 'ws://thing3.cs.stolaf.edu:8080/'
})

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
