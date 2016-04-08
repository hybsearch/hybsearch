'use strict'

const childProcess = require('child_process')

let child = childProcess.fork(__dirname + '/worker.js')

child.on('message', communique => {
	let cmd = communique[0]
	let msg = communique[1]

	if (cmd === 'error') {
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
