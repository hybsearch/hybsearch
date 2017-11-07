const execa = require('execa')

module.exports.isLinux = function() {
    return execa.sync('uname', ['-s']).stdout === 'Linux'
}

module.exports.isMac = function() {
    return execa.sync('uname', ['-s']).stdout === 'Darwin'
}
