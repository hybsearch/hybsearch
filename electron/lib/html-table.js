'use strict'
const toPairs = require('lodash/toPairs')

module.exports = makeTableFromObjectList
function makeTableFromObjectList(data) {
	let table = document.createElement('table')

	let thead = document.createElement('thead')
	let tr = document.createElement('tr')

	let first = data[0]
	if (!first) {
		return table
	}

	let keys = Object.keys(first).filter(key => !key.startsWith('__'))

	for (let key of keys) {
		let th = document.createElement('th')
		th.innerHTML = key
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
