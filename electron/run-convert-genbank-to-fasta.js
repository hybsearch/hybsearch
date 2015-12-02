'use strict'

const fs = require('fs')
const convert = require('./genbank-to-fasta')

const input = fs.readFileSync(process.argv[2], {encoding: 'utf-8'})
// console.log(input)
const converted = convert(input)
fs.writeFileSync(process.argv[3], converted, {encoding: 'utf-8'})
