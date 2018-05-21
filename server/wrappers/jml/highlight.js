module.exports.highlightSignificantResults = highlightSignificantResults
function highlightSignificantResults(item) {
	if (item.Probability < 0.05) {
		return { ...item, __highlight: true }
	}
	return item
}
