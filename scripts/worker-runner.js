'use strict'

const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

if (process.argv.length < 3) {
	console.error('usage: worker-runner.js <file.gb>')
	process.exit(1)
}

const filepath = process.argv[2]
console.log(`processing ${filepath}`)
const data = fs.readFileSync(filepath, 'utf-8')

const child = childProcess.fork(path.join(__dirname, '..', 'lib', 'worker.js'))

child.on('message', communique => {
	let [cmd, msg] = communique

	switch (cmd) {
		case 'error':
			console.error('error!', msg)
		case 'exit':
			console.log()
			console.log('exit')
		case 'finish':
			console.log('finish')
			console.log()
			console.log('the newick tree is below:')
			console.log()
			console.log(msg)
		default:
			console.log(cmd, msg)
	}

	if (cmd === 'exit' || cmd === 'error') {
		child.disconnect()
	}
})

child.send(['start', filepath, data])
