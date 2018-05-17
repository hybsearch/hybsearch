// @flow
const zip = require('lodash/zip')

function asciiArt(node, options={}) {
	let {
		char = '-',
		showInternal = false,
		compact = false,
		attributes = null,
	} = options

	// Returns the ASCII representation of the tree.
	// Based on the Ete project; this funciton was derived from
	// https://github.com/etetoolkit/ete/blob/da6a23ae7adbe98be26a232a29fd90af3a66b0b5/ete3/coretype/tree.py
	if (!attributes) {
		attributes = ['name']
	}

	let nodeName = attributes
		.map(key => (node.hasOwnProperty(key) ? node[key] : null))
		.filter(val => val !== null)
		.map(String)
		.join(', ')

	let LEN = Math.max(3, !(node.branchset || showInternal) ? nodeName.length : 3)
	let PAD = ' '.repeat(LEN)
	let PA = ' '.repeat(LEN - 1)

	if (!node.branchset) {
		return { lines: [char + '-' + nodeName], mid: 0 }
	}

	let mids = []
	let result = []
	for (let c of node.branchset) {
		let char2 = '-'
		if (node.branchset.length === 1) {
			char2 = '/'
		} else if (c === node.branchset[0]) {
			char2 = '/'
		} else if (c === node.branchset[node.branchset.length - 1]) {
			char2 = '\\'
		}

		let { lines: childLines, mid } = asciiArt(c, {
			char: char2,
			showInternal,
			compact,
			attributes,
		})

		mids.push(mid + result.length)
		result = [...result, ...childLines]
		if (!compact) {
			result.push('')
		}
	}

	if (!compact) {
		result.pop()
	}

	let lo = mids[0]
	let hi = mids[mids.length - 1]
	let end = result.length

	let prefixes = [
		...new Array(lo + 1).fill(PAD),
		...new Array(hi - lo - 1).fill(PA + '|'),
		...new Array(end - hi).fill(PAD),
	]

	let mid = Math.trunc((lo + hi) / 2)
	prefixes[mid] =
		char + '-'.repeat(LEN - 2) + prefixes[mid][prefixes[mid].length - 1]

	result = zip(prefixes, result).map(([p, l]) => p + l)

	// console.log(result)

	if (showInternal) {
		let stem = result[mid]
		result[mid] = stem[0] + nodeName + stem.slice(nodeName.length + 1)
	}

	return { lines: result, mid }
}

/*::
type NewickNode = {
	branchset?: Array<NewickNode>,
	name: string,
	length: number,
}
*/

module.exports = prettyPrintNewickTree
function prettyPrintNewickTree(rootNode /*: NewickNode*/) {
	return asciiArt(rootNode).lines.join('\n')
}
