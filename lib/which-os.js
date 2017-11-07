const execa = require('execa')

module.exports.isLinux = function() {
    return execa.sync('uname', ['-s']) === 'Linux'
}

module.exports.isMac = function() {
    return execa.sync('uname', ['-s']) === 'Darwin'
}
