// @flow
'use strict'

const present = require('present')
const START_TIME = present()

import type { HandlerArgs } from './types'
export type Message = {|
	type: 'get-uptime',
	requestId: string,
	payload: typeof undefined,
|}

function uptime({ respond }: HandlerArgs<Message>) {
	respond({ uptime: present() - START_TIME })
}

module.exports = uptime
