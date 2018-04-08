// @flow
'use strict'

const crypto = require('crypto')

module.exports = (data /*: string*/) /* : string */ => {
	let hash = crypto.createHash('sha256')
	hash.update(data)
	return hash.digest('hex')
}
