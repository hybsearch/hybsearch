'use strict'

module.exports.trimMessage = trimMessage
function trimMessage(message) {
	return JSON.parse(
		JSON.stringify(message, (k, v) => {
			if (typeof v === 'string' && v.length > 99) {
				return v.substr(0, 99) + '…'
			}
			return v
		})
	)
}
