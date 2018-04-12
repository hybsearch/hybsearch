'use strict'

require('loud-rejection/register')

// set the title to include the app version
const { version } = require('./package.json')
document.title = `HybSearch (v${version})`

// start the code
require('./ui')
