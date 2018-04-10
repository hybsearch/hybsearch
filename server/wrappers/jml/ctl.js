'use strict'

const mapValues = require('lodash/mapValues')
const groupBy = require('lodash/groupBy')

function makeControlData(speciesCounts) {
	return `species = ${Object.keys(speciesCounts).join(' ')}
seqperspecies = ${Object.values(speciesCounts).join(' ')}
locusrate = 0.8762
heredityscalar = 1
seqgencommand = -mHKY -f0.2678,0.1604,0.2031,0.3687 -t1.5161 -i0 -a0.2195 -l810
significancelevel = 0.1
burnin = 0
thinning = 1
seed = -1`
}

function getSpeciesFromPhylip(phylipData) {
	return phylipData
		.split('\n')
		.slice(1)
		.map(line => line.trim())
		.filter(line => line)
		.map(line => line.slice(0, 11))
}

module.exports = computeSpecies
function computeSpecies(phylip) {
	let allSpecies = [...getSpeciesFromPhylip(phylip)]
	let speciesCounts = mapValues(
		groupBy(allSpecies, speciesName => speciesName.split('_')[0]),
		speciesInstances => speciesInstances.length
	)

	return makeControlData(speciesCounts)
}
