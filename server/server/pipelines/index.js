// @flow
'use strict'

import { type PipelineRecord } from './types'

let _pipelines = [
	require('./beast.js'),
	require('./search.js'),
	require('./parse-newick.js'),
]

let pipelines: Map<string, PipelineRecord> = new Map(
	_pipelines.map(p => [p.name, p])
)

module.exports = pipelines
