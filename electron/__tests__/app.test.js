/* eslint-env jest */

let Application = require('spectron').Application
let electron = require('electron')
let path = require('path')

let app
beforeEach(async () => {
	app = new Application({
		path: electron,
		args: [path.join(__dirname, '..', 'main.js')],
	})
	await app.start()
})

afterEach(async () => {
	;(await app.isRunning()) && (await app.stop())
})

test('verify a visible window is opened with a title', async () => {
	// Check if the window is visible
	expect(await app.browserWindow.isVisible()).toBe(true)

	// Verify the window's title
	expect(await app.client.getTitle()).toMatch(/^Hybsearch/)
})
