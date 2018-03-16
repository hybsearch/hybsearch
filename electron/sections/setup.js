'use strict'

const getFiles = require('../lib/get-files')
const groupBy = require('lodash/groupBy')
const mapValues = require('lodash/mapValues')
const toPairs = require('lodash/toPairs')
const sortBy = require('lodash/sortBy')

// run

server()
data()

console.log(document)

// functions

function server() {
	const handleServerChange = ev => {
		if (ev.currentTarget.value !== 'other') {
			document.querySelector('#server-url').value = ev.currentTarget.value
		}
	}

	Array.from(document.querySelectorAll('[name="server"]'))
		.forEach(el => el.addEventListener('change', handleServerChange))

	handleServerChange({currentTarget: document.querySelector('[name="server"][checked]')})
}

function data() {
	const files = sortBy(getFiles(), f => f.endsWith('.gb') ? `1-${f}` : `2-${f}`)
	const groupedFiles = groupBy(files, f => {
		if (f.endsWith('.fasta')) {
			return 'fasta'
		}

		if (f.endsWith('.gb')) {
			return 'genbank'
		}

		return f.split('.')[f.split('.').length - 1]
	})

	const optgroups = mapValues(groupedFiles, group =>
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
}
