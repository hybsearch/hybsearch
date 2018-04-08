// @flow
'use strict'

import type { HandlerArgs } from './types'
export type Message = {|
	type: 'get-completed-jobs',
	requestId: string,
	payload: typeof undefined,
|}

function getCompletedJobs({ respond, allJobs }: HandlerArgs<Message>) {
	let jobs = [...allJobs.values()]
		.filter(job => job.status === 'completed')
		.map(job => job.serialize())
	respond({ jobs: jobs })
}

module.exports = getCompletedJobs
