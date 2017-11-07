// @ts-check
'use strict'

// [something something] estimate the number of generations for a species from
// some pieces of information about the species
function estimateGenerations(genLength, millionsOfYears=0.02) {
	// millionsOfYears might need to default to 0.02? Not sure. That number
	// was pulled from the original hamdis.r

	// Assume 2% per million years (standard for cytochrome B) mutation rate.
	// This allows us to calculate a likely divergence time, from which we can
	// estimate generations.

	// divergence time in million years
	let divergenceTime = millionsOfYears / 0.02

	// number of generations (used for seqgen parameters)
	let generationCount = divergenceTime * 1000000 / genLength

	return {divergenceTime, generationCount}
}

module.exports = estimateGenerations
