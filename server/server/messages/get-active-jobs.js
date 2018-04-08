// @flow
'use strict'

import type { HandlerArgs } from './types'
export type Message = {|
	type: 'get-active-jobs',
	requestId: string,
	payload: typeof undefined,
|}

function getActiveJobs({ respond, allJobs }: HandlerArgs<Message>) {
	let jobs = [...allJobs.values()]
		.filter(job => job.status === 'active')
		.map(job => job.serialize())
	respond({ jobs: jobs })
}

module.exports = getActiveJobs
