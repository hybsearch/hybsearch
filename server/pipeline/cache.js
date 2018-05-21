'use strict'

const crypto = require('crypto')
const hasha = require('hasha')
const tempy = require('tempy')
const fs = require('fs')
const path = require('path')
const slashEscape = require('slash-escape')
const mkdir = require('make-dir')

class Cache {
	constructor({ filepath, contents, pipelineName, options }) {
		this.filepath = filepath
		this.data = contents
		this.pipelineName = pipelineName
		this.options = options

		this.hashKey = hasha(`${this.pipelineName}${JSON.stringify(this.options)}`)
		this.dataHash = hasha(`${this.hashKey}:${this.data}`)

		this.get = this.get.bind(this)
		this.set = this.set.bind(this)
		this.hash = this.hash.bind(this)
		this.diskFilename = this.diskFilename.bind(this)

		let cacheRoot = process.env.DOCKER ? `/tmp/hybsearch` : tempy.directory()
		this.cacheDir = mkdir.sync(`${cacheRoot}/${this.dataHash}`)

		this.set('source', { filepath: this.filepath, contents: this.data })
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
