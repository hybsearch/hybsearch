// @flow

import * as React from 'react'
import ReactDOM from 'react-dom'

import { App } from './app2'

let container = document.querySelector('#container')

if (container) {
	ReactDOM.render(<App />, container)
}
