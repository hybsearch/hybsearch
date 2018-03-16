'use strict'

// catch unhandled promise rejections
require('electron-unhandled')()

// set up the material ui
require('./material')

// set up the code
require('./sections/setup')
require('./sections/processing')
require('./sections/display')
