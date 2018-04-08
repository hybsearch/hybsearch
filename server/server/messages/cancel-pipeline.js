// @flow
'use strict'

import type { HandlerArgs } from './types'
export type Message = {|
	type: 'cancel-pipeline',
	requestId: string,
	payload: {|
		jobId: string,
	|},
|}

function cancelPipeline({ message, respond, allJobs }: HandlerArgs<Message>) {
	let jobId = message.payload.jobId
	let job = allJobs.get(jobId)
	if (!job) {
		respond({ exists: false, cancelled: false, jobId: jobId })
		return
	}
	job.terminate()
	respond({ exists: true, cancelled: true, jobId: jobId })
}

module.exports = cancelPipeline
