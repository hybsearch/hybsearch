#!/usr/bin/env node
'use strict'

const fs = require('fs')
const ninja = require('./ninja.js')

fs.writeFileSync(process.argv[3], ninja(fs.readFileSync(process.argv[2]), '.ninjaout'), 'utf-8')
