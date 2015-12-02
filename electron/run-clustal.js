#!/usr/bin/env node
'use strict'

const fs = require('fs')
const clustal = require('./clustal.js')

const args = {
	align: true,
	pwgapopen: 15,
	pwgapext: 6.66,
	pwdnamatrix: 'IUB',
	transweight: 0.5,
	gapext: 6.66,
	gapopen: 15,
	numiter: 1,
	output: 'FASTA',
}

clustal(fs.readFileSync(process.argv[2], 'utf-8'), args, '.aln')
