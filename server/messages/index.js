// @flow
'use strict'

export type { Message } from './types'

module.exports = {
	cancelPipeline: require('./cancel-pipeline'),
	getActiveJobs: require('./get-active-jobs'),
	getCompletedJobs: require('./get-completed-jobs'),
	getPipelines: require('./get-pipelines'),
	startPipeline: require('./start-pipeline'),
	watchPipeline: require('./watch-pipeline'),
	uptime: require('./uptime'),
}
