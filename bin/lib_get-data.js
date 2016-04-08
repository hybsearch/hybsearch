require('loud-rejection/register')
const stdin = require('get-stdin')
const fs = require('fs')

module.exports = function getData(fileOrStdin) {
	if (fileOrStdin === '-') {
		return stdin()
	} else {
		return new Promise((resolve, reject) => {
			fs.readFile(fileOrStdin, 'utf-8', (err, contents) => {
				if (err) {
					reject(err)
				}
				resolve(contents)
			})
		})
	}
}
