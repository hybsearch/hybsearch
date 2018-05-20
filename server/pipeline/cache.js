'use strict'

const crypto = require('crypto')
const tempy = require('tempy')
const fs = require('fs')
const path = require('path')
const slashEscape = require('slash-escape')
const mkdir = require('make-dir')

class Cache {
	constructor({ filepath, contents, pipelineName }) {
		this.filepath = filepath
		this.data = contents
		this.pipelineName = pipelineName
		this.dataHash = this.hash(this.data)

		this.get = this.get.bind(this)
		this.set = this.set.bind(this)

		if (!process.env.DOCKER) {
			this.cacheDir = tempy.directory()
		} else {
			let name = slashEscape.escape(pipelineName)
			this.cacheDir = mkdir.sync(`/tmp/hybsearch/${name}/${this.dataHash}`)
		}

		this.set('source', { filepath: this.filepath, contents: this.data })
	}

	hash(data) {
		let hash = crypto.createHash('sha256')
		hash.update(data)
		return hash.digest('hex')
	}

	diskFilename(filename) {
		return path.join(this.cacheDir, slashEscape.escape(filename))
	}

	get(key) {
		try {
			let value = fs.readFileSync(this.diskFilename(key), 'utf-8')
			return JSON.parse(value)
		} catch (err) {
			if (err.code === 'ENOENT') {
				return ''
			}
			return ''
		}
	}

	set(key, value) {
		let serialized = JSON.stringify(value)
		fs.writeFileSync(this.diskFilename(key), serialized, 'utf-8')
	}
}

module.exports = Cache
