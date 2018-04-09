// @flow
'use strict'

import type { HandlerArgs } from './types'
export type Message = {|
	type: 'watch-pipeline',
	requestId: string,
	payload: {|
		jobId: string,
	|},
|}

function watchPipeline({
	message,
	respond,
	client,
	allJobs,
}: HandlerArgs<Message>) {
	let jobId = message.payload.jobId

	let job = allJobs.get(jobId)
	if (!job) {
		respond({ exists: false, jobId: jobId })
		return
	}

	respond({ exists: true, jobId: job.id, stages: [...job.stages.entries()] })
	job.addClient(client, client.ipAddr)
}

module.exports = watchPipeline
