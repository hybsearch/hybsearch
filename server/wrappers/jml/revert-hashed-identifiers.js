// @flow
'use strict'

const toPairs = require('lodash/toPairs')
const escape = require('lodash/escapeRegExp')
const csv = require('comma-separated-values')

/*::
type Args = {
	phylipMapping: {[key: string]: string},
	distributions: string,
	probabilities: string,
	results: string,
}
*/

module.exports = revertHashedIdentifiers
function revertHashedIdentifiers(
	{ distributions, probabilities, results, phylipMapping } /*: Args */
) {
	let mappingPairs = toPairs(phylipMapping)

	// replace the individual identifiers first
	for (let [hashed, unhashed] of mappingPairs) {
		let hashedIndividual = hashed.split('x').join('')
		let unhashedIndividual = unhashed
		let regexForIndividual = new RegExp(escape(hashedIndividual), 'g')
		results = results.replace(regexForIndividual, unhashedIndividual)
	}

	// run this after the individual identifier replacement, since the
	// species is a substring of the individual
	for (let [hashed, unhashed] of mappingPairs) {
		let hashedSpecies = hashed.split('x')[0]
		let unhashedSpecies = unhashed.split('__')[0]
		let regexForSpecies = new RegExp(escape(hashedSpecies), 'g')

		results = results.replace(regexForSpecies, unhashedSpecies)

		// these two files only have species identifiers
		distributions = distributions.replace(regexForSpecies, unhashedSpecies)
		probabilities = probabilities.replace(regexForSpecies, unhashedSpecies)
	}

	let distObj = csv.parse(distributions, { header: true, cellDelimiter: '\t' })
	let probObj = csv.parse(probabilities, { header: true, cellDelimiter: '\t' })
	let resObj = csv.parse(results, { header: true, cellDelimiter: '\t' })

	return { distributions: distObj, probabilities: probObj, results: resObj }
}
