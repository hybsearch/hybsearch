// @flow
'use strict'

import { type PipelineRecord } from './types'

let pipelines: Map<string, PipelineRecord> = new Map([
	['beast', require('./beast.js')],
	['mrbayes', require('./search.js')],
	['parse-newick', require('./parse-newick.js')],
])

module.exports = pipelines
