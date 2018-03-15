'use strict'

const consensusTreeToNewick = require('./consensus-to-newick')
const parser = require('./parser')

module.exports = { parse: parser, consensusTreeToNewick }
