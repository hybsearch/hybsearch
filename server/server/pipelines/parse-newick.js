// @flow
'use strict'

import type { PipelineRecord, Pipeline } from './types'

const { parse: parseNewick } = require('../../newick')

let newickPipe: Pipeline = [
	{
		// turns the Newick tree into a JSON object
		input: ['source'],
		transform: ([data]) => [parseNewick(data)],
		output: ['newick-json'],
	},
]

let record: PipelineRecord = {
	name: 'Parse Newick',
	pipeline: newickPipe,
}

module.exports = record
