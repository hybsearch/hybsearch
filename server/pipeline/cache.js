'use strict'

const crypto = require('crypto')
const tempy = require('tempy')
const fs = require('fs')
const path = require('path')
const mkdir = require('make-dir')

class Cache {
	constructor({ filepath, contents }) {
		this.filepath = filepath
		this.data = contents

		this.memcache = new Map()

		if (!process.env.DOCKER) {
			this.cacheDir = tempy.directory()
		} else {
			this.cacheDir = mkdir.sync('/tmp/hybsearch')
		}

		this.hashKey = this.hashKey.bind(this)
		this.get = this.get.bind(this)
		this.set = this.set.bind(this)
		this._dataHash = this._hash(this.data)

		this.set('source', { filepath: this.filepath, contents: this.data })
	}

	_hash(data) {
		let hash = crypto.createHash('sha256')
		hash.update(data)
		return hash.digest('hex')
	}

	hashKey(key) {
		return this._hash(`${key}:${this._dataHash}`)
	}

	diskFilename(hashedKey) {
		return path.join(this.cacheDir, hashedKey)
	}

	get(key) {
		key = this.hashKey(key)

		if (this.memcache.has(key)) {
			let value = this.memcache.get(key)
			return JSON.parse(value)
		}

		try {
			let value = fs.readFileSync(this.diskFilename(key), 'utf-8')
			this.memcache.set(key, value)
			return JSON.parse(value)
		} catch (err) {
			if (err.code === 'ENOENT') {
				return ''
			}
			return ''
		}
	}

	set(key, value) {
		key = this.hashKey(key)
		let serialized = JSON.stringify(value)
		this.memcache.set(key, serialized)
		fs.writeFileSync(this.diskFilename(key), serialized, 'utf-8')
	}
}

module.exports = Cache