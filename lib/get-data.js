// @ts-check
require('loud-rejection/register')
const stdin = require('get-stdin')
const fs = require('fs')

module.exports = function getData(fileOrStdin) {
	if (!fileOrStdin || fileOrStdin === '-') {
		return stdin()
	}

	return readFilePromise(fileOrStdin)
}

module.exports.readFile = readFilePromise
function readFilePromise(filename) {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, 'utf-8', (err, contents) => {
			if (err) {
				reject(err)
			}
			resolve(contents)
		})
	})
}
