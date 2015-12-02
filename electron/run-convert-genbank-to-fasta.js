'use strict'

const fs = require('fs')
const convert = require('./genbank-to-fasta')

console.log(convert(fs.readFileSync(process.argv[2], {encoding: 'utf-8'})))
