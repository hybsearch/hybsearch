'use strict'

// helper function: given a list of items, return them in pairs
function* paired(list) {
	let prior
	let firstItem = true
	for (let item of list) {
		// make sure to start with two items
		if (firstItem) {
			firstItem = false
			prior = item
			continue
		}
		yield [prior, item]
		prior = item
	}
}

module.exports = paired
