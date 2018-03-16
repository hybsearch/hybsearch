'use strict'

const mdc = require('material-components-web/dist/material-components-web.js')

// this does something…
mdc.autoInit()

// enable ripple buttons
Array.from(document.querySelectorAll('.mdc-button'))
	.forEach(node => {
		mdc.ripple.MDCRipple.attachTo(node)
	})

// enable ripple on text fields
Array.from(document.querySelectorAll('.mdc-text-field'))
	.forEach(node => {
		mdc.textField.MDCTextField.attachTo(node)
	})

// enable tabs
Array.from(document.querySelectorAll('.mdc-tab-bar'))
	.forEach(node => {
		node.tabBar = new mdc.tabs.MDCTabBar(node)

		node.tabBar.tabs.forEach((tab) => {
			tab.preventDefaultOnClick = true;
		});

		node.tabBar.listen('MDCTabBar:change', ({detail: tabs}) => {
			updatePanel(tabs.activeTabIndex);
		});

		let panels = document.querySelector(node.dataset.panelSelector);

		function updatePanel(index) {
			let activePanel = panels.querySelector('.panel.active');
			if (activePanel) {
				activePanel.classList.remove('active');
				activePanel['aria-hidden'] = true
			}

			let newActivePanel = panels.querySelector('.panel:nth-child(' + (index + 1) + ')');
			if (newActivePanel) {
				newActivePanel.classList.add('active');
				activePanel['aria-hidden'] = false
			}
		}
	})
