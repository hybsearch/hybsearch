'use strict'

const { parseFasta } = require('./fasta/parse')
const groupBy = require('lodash/groupBy')
const toPairs = require('lodash/toPairs')
const difference = require('lodash/difference')
const sortBy = require('lodash/sortBy')
const fs = require('fs')
const path = require('path')

function inflateTemplate(vars) {
	let template = fs.readFileSync(path.join(__dirname, 'template.xml'), 'utf-8')

	let availableMatches = template.match(/\{\{.*?\}\}/g)
	if (!availableMatches) {
		throw new Error('no templatable variables found in the template!')
	}

	let availableVars = Array.from(new Set(availableMatches.slice(1))).map(
		identifier => identifier.replace(/\{\{(.*)\}\}/, '$1')
	)

	let mismatch = difference(availableVars, Object.keys(vars))
	if (mismatch.length) {
		let a = availableVars.join(',')
		let p = Object.keys(vars).join(',')
		let m = mismatch.join(',')
		let msg = `available variables in template and provided variables didn't match: available (${a}), provided (${p}), mismatch: (${m})`
		throw new Error(msg)
	}

	for (let [key, value] of toPairs(vars)) {
		template = template.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
	}

	return template
}

module.exports = fastaToBeast
function fastaToBeast(
	fastaData,
	{ chainLength = '10000000', particleDir, numParticles, stepSize } = {}
) {
	let items = parseFasta(fastaData)
	items = sortBy(items, ({ species }) => species)

	let seqs = items.map(({ species, sequence }) => {
		let id = `seq_${species}1`
		let taxon = species
		let count = 4 // TODO: setting to 4 until we know how to compute it
		let value = sequence
		return `\t<sequence id="${id}" taxon="${taxon}" totalcount="${count}" value="${value}"/>`
	})

	let groupedForTaxon = groupBy(items, ({ species }) =>
		species.replace(/^(.*?_.*?)__.*/, '$1')
	)
	let taxon = toPairs(groupedForTaxon).map(([key, values]) => {
		// <taxon id="dunni" spec="TaxonSet">
		//     <taxon id="Kinosternon_dunni__KF301374" spec="Taxon"/>
		// </taxon>
		let taxon = values.map(
			({ species }) => `<taxon id="${species}" spec="Taxon"/>`
		)
		return `\t\t\t\t<taxon id="${key}" spec="TaxonSet">
\t\t\t\t\t${taxon.join('\n\t\t\t\t\t')}
\t\t\t\t</taxon>`
	})

	return inflateTemplate({
		filename: 'data',
		sequences: seqs.join('\n'),
		taxon: taxon.join('\n'),
		chainLength: chainLength,
		particleDir: particleDir,
		numParticles: numParticles,
		stepSize: stepSize,
	})
}
