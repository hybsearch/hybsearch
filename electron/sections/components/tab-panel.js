// @flow
/* globals SyntheticEvent */

import * as React from 'react'

type Props = {
	render: ({
		activeTabIndex: number,
		onTabChange: (ev: SyntheticEvent<HTMLInputElement>) => any,
	}) => React.Node,
}

type State = {
	activeTabIndex: number,
}

export class TabPanel extends React.Component<Props, State> {
	state = {
		activeTabIndex: 0,
	}

	onTabChange = (ev: any) =>
		this.setState(() => ({
			activeTabIndex: ev.detail.activeTabIndex,
		}))

	render() {
		const { activeTabIndex } = this.state
		const onTabChange = this.onTabChange
		return this.props.render({ activeTabIndex, onTabChange })
	}
}
