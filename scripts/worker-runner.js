#!/usr/bin/env node
'use strict'

const getData = require('../lib/get-data')
const path = require('path')
const childProcess = require('child_process')

if (process.argv.length < 3) {
	console.error('usage: worker-runner.js <file.gb>')
	process.exit(1)
}

async function main() {
	const filepath = process.argv[2]
	console.log(`processing ${filepath}`)
	const data = await getData(filepath)

	const child = childProcess.fork(path.join(__dirname, '..', 'lib', 'worker.js'))

	child.on('message', communique => {
		let [cmd, msg] = communique

		switch (cmd) {
			case 'error':
				console.error('error!', msg)
				break
			case 'exit':
				console.log()
				console.log('exit')
				break
			case 'finish':
				console.log('finish')
				console.log()
				console.log('the newick tree is below:')
				console.log()
				console.log(msg)
				break
			default:
				console.log(cmd, msg)
		}

		if (cmd === 'exit' || cmd === 'error') {
			child.disconnect()
		}
	})

	child.send(['start', filepath, data])
}

main()
