// @flow
'use strict'

const hashString = require('../lib/hash-string')
const tempy = require('tempy')
const fs = require('fs')
const path = require('path')
const mkdir = require('make-dir')

type Args = {
	filepath: string,
	contents: string,
}

class Cache {
	filepath: string
	data: string
	dataHash: string
	memcache: Map<string, string> = new Map()
	cacheDir: string = process.env.DOCKER
		? mkdir.sync('/tmp/hybsearch')
		: tempy.directory()

	constructor({ filepath, contents }: Args) {
		this.filepath = filepath
		this.data = contents
		this.dataHash = hashString(this.data)

		this.set('source', { filepath: this.filepath, contents: this.data })
	}

	hashKey = (key: string) => {
		return hashString(`${key}:${this.dataHash}`)
	}

	diskFilename = (hashedKey: string) => {
		return path.join(this.cacheDir, hashedKey)
	}

	get = (key: string) => {
		key = this.hashKey(key)

		let value = this.memcache.get(key)
		if (value !== undefined) {
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

	set = (key: string, value: mixed) => {
		key = this.hashKey(key)
		let serialized = JSON.stringify(value)
		this.memcache.set(key, serialized)
		fs.writeFileSync(this.diskFilename(key), serialized, 'utf-8')
	}
}

module.exports = Cache
