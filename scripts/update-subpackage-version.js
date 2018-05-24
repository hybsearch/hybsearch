let fs = require('fs')
let path = require('path')

let childDir = process.argv[2]
if (!childDir) {
	console.error('usage: update-subpackage-version.js <dir>')
	process.exit(1)
}

let rootPkg = require("../package.json")

let childPkgPath = path.join(childDir, 'package.json')
let childPkg = JSON.parse(fs.readFileSync(childPkgPath, 'utf-8'))

childPkg.version = rootPkg.version

fs.writeFileSync(childPkgPath, JSON.stringify(childPkg), "utf-8")
