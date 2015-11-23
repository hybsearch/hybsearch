#!/usr/bin/env node
'use strict'

const fs = require('fs')
const ninja = require('./ninja.js')

ninja(fs.readFileSync(process.argv[2]), '.ninjaout')
