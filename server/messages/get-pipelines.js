// @flow
'use strict'

const PIPELINES = require('../pipeline/pipelines')

import type { HandlerArgs } from './types'
export type Message = {|
	type: 'get-pipelines',
	requestId: string,
	payload: typeof undefined,
|}

function getPipelines({ respond }: HandlerArgs<Message>) {
	let pipelines = [...PIPELINES.values()].map(pipe => JSON.stringify(pipe))
	respond({ pipelines })
}

module.exports = getPipelines
