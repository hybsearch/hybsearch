// @flow
'use strict'

const Job = require('../job')

import type { HandlerArgs } from './types'
export type Message = {|
	type: 'start-pipeline',
	requestId: string,
	payload: {|
		pipeline: string,
		filepath: ?string,
		data: string,
	|},
|}

function startPipeline({ message, respond, allJobs }: HandlerArgs<Message>) {
	let job = new Job(message.payload)
	allJobs.set(job.id, job)
	respond({ jobId: job.id })
}

module.exports = startPipeline
