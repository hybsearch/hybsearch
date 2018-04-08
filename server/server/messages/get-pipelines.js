// @flow
'use strict'

const PIPELINES = require('../pipelines')

import type { HandlerArgs } from './types'
export type Message = {|
	type: 'get-pipelines',
	requestId: string,
|}

function getPipelines({ respond }: HandlerArgs<Message>) {
	let pipelines = [...PIPELINES.values()].map(pipe => JSON.stringify(pipe))
	respond({ pipelines })
}

module.exports = getPipelines
