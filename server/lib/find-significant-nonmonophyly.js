module.exports.findSignificantNonmonophyly = findSignificantNonmonophyly
function findSignificantNonmonophyly(jmlOutput, nmSequencesFromEnt) {
	let highlighted = jmlOutput.results.filter(entry => entry.__highlight)

	let jmlNm = nmSequencesFromEnt.nm.map(seq => seq.ident)

	let highlightedAndFiltered = highlighted.filter(entry =>
		jmlNm
			.map(nmIndent => `[${nmIndent}]`)
			.some(
				nmIndent =>
					entry.seq1.includes(nmIndent) || entry.seq2.includes(nmIndent)
			)
	)

	let cleaned = highlightedAndFiltered.map(entry => ({
		seq1: entry.seq1,
		seq2: entry.seq2,
		distance: entry.Distance,
		probability: entry.Probability,
		__highlight: entry.__highlight,
	}))

	return cleaned
}
