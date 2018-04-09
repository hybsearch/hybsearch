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

function startPipeline({
	message,
	respond,
	client,
	allJobs,
}: HandlerArgs<Message>) {
	let job = new Job(message.payload)
	job.addClient(client, client.ipAddr)

	allJobs.set(job.id, job)

	respond({ jobId: job.id, stages: job.stages() })
}

module.exports = startPipeline
