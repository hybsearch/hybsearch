// @flow

require('loud-rejection/register')
const stdin = require('get-stdin')
const fs = require('fs')

module.exports = function getData(fileOrStdin: string): Promise<string> {
	if (!fileOrStdin || fileOrStdin === '-') {
		return stdin()
	}

	return readFile(fileOrStdin)
}

module.exports.readFile = readFile
function readFile(filename: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, 'utf-8', (err, contents) => {
			if (err) {
				reject(err)
			}
			resolve(contents)
		})
	})
}
