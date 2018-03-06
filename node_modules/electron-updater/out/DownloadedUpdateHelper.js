"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DownloadedUpdateHelper = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _crypto;

function _load_crypto() {
    return _crypto = require("crypto");
}

var _fs;

function _load_fs() {
    return _fs = require("fs");
}

var _lodash;

function _load_lodash() {
    return _lodash = _interopRequireDefault(require("lodash.isequal"));
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @private **/
class DownloadedUpdateHelper {
    constructor(cacheDir) {
        this.cacheDir = cacheDir;
        this._file = null;
        this._packageFile = null;
        this.versionInfo = null;
        this.fileInfo = null;
    }
    get file() {
        return this._file;
    }
    get packageFile() {
        return this._packageFile;
    }
    validateDownloadedPath(updateFile, versionInfo, fileInfo, logger) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if (_this.versionInfo != null && _this.file === updateFile) {
                // update has already been downloaded from this running instance
                // check here only existence, not checksum
                return (0, (_lodash || _load_lodash()).default)(_this.versionInfo, versionInfo) && (0, (_lodash || _load_lodash()).default)(_this.fileInfo, fileInfo) && (yield (0, (_fsExtraP || _load_fsExtraP()).pathExists)(updateFile));
            }
            // update has already been downloaded from some previous app launch
            if (yield DownloadedUpdateHelper.isUpdateValid(updateFile, fileInfo, logger)) {
                logger.info(`Update has already been downloaded ${updateFile}).`);
                return true;
            }
            return false;
        })();
    }
    setDownloadedFile(downloadedFile, packageFile, versionInfo, fileInfo) {
        this._file = downloadedFile;
        this._packageFile = packageFile;
        this.versionInfo = versionInfo;
        this.fileInfo = fileInfo;
    }
    clear() {
        this._file = null;
        this.versionInfo = null;
        this.fileInfo = null;
    }
    static isUpdateValid(updateFile, fileInfo, logger) {
        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if (!(yield (0, (_fsExtraP || _load_fsExtraP()).pathExists)(updateFile))) {
                logger.info("No cached update available");
                return false;
            }
            const sha512 = yield hashFile(updateFile);
            if (fileInfo.info.sha512 !== sha512) {
                logger.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${sha512}, expected: ${fileInfo.info.sha512}`);
                return false;
            }
            return true;
        })();
    }
}
exports.DownloadedUpdateHelper = DownloadedUpdateHelper;
function hashFile(file, algorithm = "sha512", encoding = "base64", options) {
    return new Promise((resolve, reject) => {
        const hash = (0, (_crypto || _load_crypto()).createHash)(algorithm);
        hash.on("error", reject).setEncoding(encoding);
        (0, (_fs || _load_fs()).createReadStream)(file, Object.assign({}, options, { highWaterMark: 1024 * 1024 /* better to use more memory but hash faster */ })).on("error", reject).on("end", () => {
            hash.end();
            resolve(hash.read());
        }).pipe(hash, { end: false });
    });
}
//# sourceMappingURL=DownloadedUpdateHelper.js.map