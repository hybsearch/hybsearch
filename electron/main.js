'use strict'

const {
	app, // Module to control application life.
	BrowserWindow, // Module to create native browser window.
	Menu,
} = require('electron')

// catch unhandled promise rejections
require('electron-unhandled')()

const isDev = require('electron-is-dev')

// check for updates
const { autoUpdater } = require('electron-updater')
autoUpdater.checkForUpdatesAndNotify()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = new Set()

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
	let win = new BrowserWindow({
		width: 900,
		height: 775,
		backgroundColor: '#F7F7F7',
		tabbingIdentifier: 'mainGroup',
	})

	// and load the index.html of the app.
	win.loadURL(HTML_PATH)

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object so that it can be GCd.
		windows.delete(win)
	})

	win.on('new-window-for-tab', () => {
		// `new-window-for-tab` is fired when the native "new tab" button is clicked
		createWindow()
	})

	windows.add(win)
}

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (windows.size === 0) {
		createWindow()
	}
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow)
app.on('ready', createMenus)

function createMenus() {
	const template = [
		{
			label: 'File',
			submenu: [
				{
					label: 'New Window',
					click: createWindow,
					accelerator: 'CommandOrControl+N',
				},
			],
		},
		{
			role: 'editMenu',
		},
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forcereload' },
				{ role: 'toggledevtools' },
				{ type: 'separator' },
				{ role: 'resetzoom' },
				{ role: 'zoomin' },
				{ role: 'zoomout' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' },
			],
		},
		{
			role: 'windowMenu',
		},
		{
			role: 'help',
			submenu: [
				{
					label: 'Learn More',
					click() {
						require('electron').shell.openExternal(
							'https://github.com/hybsearch/hybsearch'
						)
					},
				},
			],
		},
	]

	if (process.platform === 'darwin') {
		template.unshift({
			label: app.getName(),
			submenu: [
				{ role: 'about' },
				{ type: 'separator' },
				{ role: 'services', submenu: [] },
				{ type: 'separator' },
				{ role: 'hide' },
				{ role: 'hideothers' },
				{ role: 'unhide' },
				{ type: 'separator' },
				{ role: 'quit' },
			],
		})
	}

	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}
