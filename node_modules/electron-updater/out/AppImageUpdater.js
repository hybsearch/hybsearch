"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AppImageUpdater = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _child_process;

function _load_child_process() {
    return _child_process = require("child_process");
}

var _electronIsDev;

function _load_electronIsDev() {
    return _electronIsDev = _interopRequireDefault(require("electron-is-dev"));
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _path = _interopRequireWildcard(require("path"));

require("source-map-support/register");

var _BaseUpdater;

function _load_BaseUpdater() {
    return _BaseUpdater = require("./BaseUpdater");
}

var _FileWithEmbeddedBlockMapDifferentialDownloader;

function _load_FileWithEmbeddedBlockMapDifferentialDownloader() {
    return _FileWithEmbeddedBlockMapDifferentialDownloader = require("./differentialDownloader/FileWithEmbeddedBlockMapDifferentialDownloader");
}

var _Provider;

function _load_Provider() {
    return _Provider = require("./Provider");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AppImageUpdater extends (_BaseUpdater || _load_BaseUpdater()).BaseUpdater {
    constructor(options, app) {
        super(options, app);
    }
    checkForUpdatesAndNotify() {
        if ((_electronIsDev || _load_electronIsDev()).default) {
            return Promise.resolve(null);
        }
        if (process.env.APPIMAGE == null) {
            if (process.env.SNAP == null) {
                this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage");
            } else {
                this._logger.info("SNAP env is defined, updater is disabled");
            }
            return Promise.resolve(null);
        }
        return super.checkForUpdatesAndNotify();
    }
    /*** @private */
    doDownloadUpdate(updateInfo, cancellationToken) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const provider = yield _this.provider;
            const fileInfo = (0, (_Provider || _load_Provider()).findFile)(provider.resolveFiles(updateInfo), "AppImage");
            const requestHeaders = yield _this.computeRequestHeaders();
            const downloadOptions = {
                skipDirCreation: true,
                headers: requestHeaders,
                cancellationToken,
                sha512: fileInfo.info.sha512
            };
            return yield _this.executeDownload({
                fileExtension: "AppImage",
                downloadOptions,
                fileInfo,
                updateInfo,
                task: (() => {
                    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (updateFile) {
                        const oldFile = process.env.APPIMAGE;
                        if (oldFile == null) {
                            throw (0, (_builderUtilRuntime || _load_builderUtilRuntime()).newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
                        }
                        let isDownloadFull = false;
                        try {
                            yield new (_FileWithEmbeddedBlockMapDifferentialDownloader || _load_FileWithEmbeddedBlockMapDifferentialDownloader()).FileWithEmbeddedBlockMapDifferentialDownloader(fileInfo.info, _this.httpExecutor, {
                                newUrl: fileInfo.url.href,
                                oldFile,
                                logger: _this._logger,
                                newFile: updateFile,
                                useMultipleRangeRequest: provider.useMultipleRangeRequest,
                                requestHeaders
                            }).download();
                        } catch (e) {
                            _this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
                            // during test (developer machine mac) we must throw error
                            isDownloadFull = process.platform === "linux";
                        }
                        if (isDownloadFull) {
                            yield _this.httpExecutor.download(fileInfo.url.href, updateFile, downloadOptions);
                        }
                        yield (0, (_fsExtraP || _load_fsExtraP()).chmod)(updateFile, 0o755);
                    });

                    return function task(_x) {
                        return _ref.apply(this, arguments);
                    };
                })()
            });
        })();
    }
    doInstall(installerPath, isSilent, isRunAfter) {
        const appImageFile = process.env.APPIMAGE;
        if (appImageFile == null) {
            throw (0, (_builderUtilRuntime || _load_builderUtilRuntime()).newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        }
        // https://stackoverflow.com/a/1712051/1910191
        (0, (_fsExtraP || _load_fsExtraP()).unlinkSync)(appImageFile);
        let destination;
        if (_path.basename(installerPath) === _path.basename(appImageFile)) {
            // no version in the file name, overwrite existing
            destination = appImageFile;
        } else {
            destination = _path.join(_path.dirname(appImageFile), _path.basename(installerPath));
        }
        (0, (_child_process || _load_child_process()).execFileSync)("mv", ["-f", installerPath, destination]);
        const env = Object.assign({}, process.env, { APPIMAGE_SILENT_INSTALL: "true" });
        if (isRunAfter) {
            (0, (_child_process || _load_child_process()).spawn)(destination, [], {
                detached: true,
                stdio: "ignore",
                env
            }).unref();
        } else {
            env.APPIMAGE_EXIT_AFTER_INSTALL = "true";
            (0, (_child_process || _load_child_process()).execFileSync)(destination, [], { env });
        }
        return true;
    }
}
exports.AppImageUpdater = AppImageUpdater; //# sourceMappingURL=AppImageUpdater.js.map