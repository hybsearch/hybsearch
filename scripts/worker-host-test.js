'use strict'

const path = require('path')
const childProcess = require('child_process')

const filepath = process.argv[2] || path.join(__dirname, '..', 'data', 'emydura-short.gb')
console.log(`processing ${filepath}`)

const child = childProcess.fork(path.join(__dirname, '..', 'lib', 'worker.js'))

child.on('message', communique => {
	let cmd = communique[0]
	let msg = communique[1]

	if (cmd === 'error') {
		console.error('error!', msg)
	} else {
		console.log(cmd, msg)
	}

	if (cmd == 'exit' || cmd == 'error') {
		child.disconnect()
	}
})

child.send(filepath)
