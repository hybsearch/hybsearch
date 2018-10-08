'use strict'

// [something something] estimate the number of generations for a species from
// some pieces of information about the species

// Estimate number of generations based on 2% mutation rate, generation length
// of 10 years, and population size 100.
// This is used in the SeqGen input
function estimateGenerations(
	percentDifferent,
	genLength = 10,
	mutationRate = 0.02
) {
	// Assume 2% per million years (standard for cytochrome B) mutation rate.
	// This allows us to calculate a likely divergence time, from which we can
	// estimate generations.

	// Find divergence time in millions of years:
	let divergenceTime = percentDifferent / mutationRate

	// Lastly, find number of generations
	let generationCount = (divergenceTime * 1000000) / genLength

	return { divergenceTime, generationCount }
}

module.exports = estimateGenerations
