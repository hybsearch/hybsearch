module.exports.removeCircularLinks = function(obj) {
	return JSON.parse(
		JSON.stringify(obj, function(key, val) {
			if (['parent', 'nmInner', 'nmOuter'].includes(key)) {
				return undefined
			}
			return val
		})
	)
}
