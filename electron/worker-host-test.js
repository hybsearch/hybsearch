'use strict'

const childProcess = require('child_process')

// let file = {path: 'data/emydura-short.gb'}
// let cmd = 'node'
// let args = ['./worker.js', file.path]
// let opts = {
// 	encoding: 'utf8',
// 	maxBuffer: 400 * 1024, // 400KB
// 	stdio: ['ignore', 'ipc', 'pipe'],
// }

// let child = childProcess.spawn(cmd, opts)

let child = childProcess.fork(__dirname + '/worker.js')

child.on('message', communique => {
	let cmd = communique[0]
	let msg = communique[1]
	if (cmd == 'error') {
		console.error('error!', msg)
	}
	else {
		console.log(cmd, msg)
	}

	if (cmd == 'exit' || cmd == 'error') {
		child.disconnect()
	}
})

child.send('data/ent.gb')
// child.send('data/emydura-short.gb')
