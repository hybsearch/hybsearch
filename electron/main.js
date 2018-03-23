'use strict'

const { app, BrowserWindow } = require('electron')

// catch unhandled promise rejections
require('electron-unhandled')()

const isDev = require('electron-is-dev')

// check for updates
const { autoUpdater } = require('electron-updater')
autoUpdater.checkForUpdatesAndNotify()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

const HTML_PATH = isDev
	? `file://${__dirname}/index.html`
	: `file://${__dirname}/out/index.html`

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 900,
		height: 775,
		backgroundColor: '#F7F7F7',
	})

	// and load the index.html of the app.
	mainWindow.loadURL(HTML_PATH)

	// Open the DevTools.
	// mainWindow.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object so that it can be GCd.
		mainWindow = null
	})
}

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow)
