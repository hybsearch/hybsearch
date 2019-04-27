'use strict'

const mapValues = require('lodash/mapValues')
const groupBy = require('lodash/groupBy')

let defaultConfig = `
locusrate = 1.0
heredityscalar = 0.25
seqgencommand = -mHKY -f0.2678,0.1604,0.2031,0.3687 -t1.5161 -i0 -a0.2195 -l810
significancelevel = 0.9999
burnin = 0
thinning = 1
seed = -1`

function makeControlData(speciesCounts, config) {
	return `species = ${Object.keys(speciesCounts).join(' ')}
seqperspecies = ${Object.values(speciesCounts).join(' ')}
${config || defaultConfig}
`
}

function getSpeciesFromPhylip(phylipData) {
	return phylipData
		.split('\n')
		.slice(1)
		.map(line => line.slice(0, 10))
		.map(line => line.trim())
		.filter(line => line)
		.map(line => line.replace(/\d/g, ''))
}

module.exports = computeSpecies
function computeSpecies(phylip, config) {
	let allSpecies = [...getSpeciesFromPhylip(phylip)]
	let speciesCounts = mapValues(
		groupBy(allSpecies, speciesName => speciesName.split('x')[0]),
		speciesInstances => speciesInstances.length
	)

	return makeControlData(speciesCounts, config)
}
