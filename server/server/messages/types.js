// @flow
'use strict'

const WebSocket = require('ws')
const Job = require('../job')

import type { Message as StartPipelineMessage } from './start-pipeline'
import type { Message as WatchPipelineMessage } from './watch-pipeline'
import type { Message as CancelPipelineMessage } from './cancel-pipeline'
import type { Message as GetActiveJobsMessage } from './get-active-jobs'
import type { Message as GetCompletedJobsMessage } from './get-completed-jobs'
import type { Message as GetPipelinesMessage } from './get-pipelines'
import type { Message as GetUptimeMessage } from './uptime'

export type Message =
	| StartPipelineMessage
	| WatchPipelineMessage
	| CancelPipelineMessage
	| GetActiveJobsMessage
	| GetCompletedJobsMessage
	| GetPipelinesMessage
	| GetUptimeMessage

export type HandlerArgs<T> = {|
	message: T,
	respond: Object => any,
	client: WebSocket,
	allJobs: Map<string, Job>,
|}
