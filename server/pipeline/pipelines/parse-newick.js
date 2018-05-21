'use strict'

const { parse: parseNewick } = require('../../newick')

let options = {}

let steps = [
	{
		// turns the Newick tree into a JSON object
		input: ['source'],
		transform: ([data]) => [parseNewick(data)],
		output: ['newick-json:1'],
	},
]

module.exports = { steps, options }
