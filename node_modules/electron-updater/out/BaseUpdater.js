"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BaseUpdater = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _path = _interopRequireWildcard(require("path"));

var _AppUpdater;

function _load_AppUpdater() {
    return _AppUpdater = require("./AppUpdater");
}

var _main;

function _load_main() {
    return _main = require("./main");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class BaseUpdater extends (_AppUpdater || _load_AppUpdater()).AppUpdater {
    constructor(options, app) {
        super(options, app);
        this.quitAndInstallCalled = false;
        this.quitHandlerAdded = false;
    }
    quitAndInstall(isSilent = false, isForceRunAfter = false) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            _this._logger.info(`Install on explicit quitAndInstall`);
            const isInstalled = yield _this.install(isSilent, isSilent ? isForceRunAfter : true);
            if (isInstalled) {
                setImmediate(function () {
                    if (_this.app.quit !== undefined) {
                        _this.app.quit();
                    }
                    _this.quitAndInstallCalled = false;
                });
            }
        })();
    }
    executeDownload(taskOptions) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if (_this2.listenerCount((_main || _load_main()).DOWNLOAD_PROGRESS) > 0) {
                taskOptions.downloadOptions.onProgress = function (it) {
                    return _this2.emit((_main || _load_main()).DOWNLOAD_PROGRESS, it);
                };
            }
            const updateInfo = taskOptions.updateInfo;
            const version = updateInfo.version;
            const fileInfo = taskOptions.fileInfo;
            const packageInfo = fileInfo.packageInfo;
            const cacheDir = _this2.downloadedUpdateHelper.cacheDir;
            yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(cacheDir);
            const updateFileName = `installer-${version}.${taskOptions.fileExtension}`;
            const updateFile = _path.join(cacheDir, updateFileName);
            const packageFile = packageInfo == null ? null : _path.join(cacheDir, `package-${version}.${_path.extname(packageInfo.path) || "7z"}`);
            const done = function () {
                _this2.downloadedUpdateHelper.setDownloadedFile(updateFile, packageFile, updateInfo, fileInfo);
                _this2.addQuitHandler();
                _this2.emit((_main || _load_main()).UPDATE_DOWNLOADED, updateInfo);
                return packageFile == null ? [updateFile] : [updateFile, packageFile];
            };
            const log = _this2._logger;
            if (yield _this2.downloadedUpdateHelper.validateDownloadedPath(updateFile, updateInfo, fileInfo, log)) {
                return done();
            }
            const removeFileIfAny = function () {
                _this2.downloadedUpdateHelper.clear();
                return (0, (_fsExtraP || _load_fsExtraP()).unlink)(updateFile).catch(function () {
                    // ignored
                });
            };
            // https://github.com/electron-userland/electron-builder/pull/2474#issuecomment-366481912
            let nameCounter = 0;
            let tempUpdateFile = _path.join(cacheDir, `temp-${updateFileName}`);
            for (let i = 0; i < 3; i++) {
                try {
                    yield (0, (_fsExtraP || _load_fsExtraP()).unlink)(tempUpdateFile);
                } catch (e) {
                    if (e.code === "ENOENT") {
                        break;
                    }
                    log.warn(`Error on remove temp update file: ${e}`);
                    tempUpdateFile = _path.join(cacheDir, `temp-${nameCounter++}-${updateFileName}`);
                }
            }
            try {
                yield taskOptions.task(tempUpdateFile, packageFile, removeFileIfAny);
                yield (0, (_fsExtraP || _load_fsExtraP()).rename)(tempUpdateFile, updateFile);
            } catch (e) {
                yield removeFileIfAny();
                if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).CancellationError) {
                    log.info("Cancelled");
                    _this2.emit("update-cancelled", updateInfo);
                }
                throw e;
            }
            log.info(`New version ${version} has been downloaded to ${updateFile}`);
            return done();
        })();
    }
    install(isSilent, isRunAfter) {
        var _this3 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if (_this3.quitAndInstallCalled) {
                _this3._logger.warn("install call ignored: quitAndInstallCalled is set to true");
                return false;
            }
            const installerPath = _this3.downloadedUpdateHelper.file;
            // todo check (for now it is ok to no check as before, cached (from previous launch) update file checked in any case)
            // const isValid = await this.isUpdateValid(installerPath)
            if (installerPath == null) {
                _this3.dispatchError(new Error("No valid update available, can't quit and install"));
                return false;
            }
            // prevent calling several times
            _this3.quitAndInstallCalled = true;
            try {
                _this3._logger.info(`Install: isSilent: ${isSilent}, isRunAfter: ${isRunAfter}`);
                return _this3.doInstall(installerPath, isSilent, isRunAfter);
            } catch (e) {
                _this3.dispatchError(e);
                return false;
            }
        })();
    }
    addQuitHandler() {
        var _this4 = this;

        if (this.quitHandlerAdded || !this.autoInstallOnAppQuit) {
            return;
        }
        this.quitHandlerAdded = true;
        this.app.once("quit", (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if (!_this4.quitAndInstallCalled) {
                _this4._logger.info("Auto install update on quit");
                yield _this4.install(true, false);
            }
        }));
    }
}
exports.BaseUpdater = BaseUpdater; //# sourceMappingURL=BaseUpdater.js.map