// @flow

import * as React from 'react'

import { Ripple } from 'rmwc/Ripple'
import { IconToggle } from 'rmwc/IconToggle'
import { Card, CardActions, CardActionButtons } from 'rmwc/Card'
import { Typography } from 'rmwc/Typography'

import styled from 'styled-components'

type Props = {
	title?: React.Node,
	content?: React.Node,
	actions?: Array<React.Node>,
	expanded?: boolean,
	contentTopPadding?: boolean,
	expandable?: boolean,
}

type State = { expanded: boolean }

export class AppSection extends React.Component<Props, State> {
	state = {
		expanded:
			this.props.expandable === false
				? true
				: typeof this.props.expanded === 'boolean' ? this.props.expanded : true,
	}

	handleToggle = (ev: any) =>
		this.setState(() => ({ expanded: ev.detail.isOn }))

	toggleExpansion = () =>
		this.setState(state => ({ expanded: !state.expanded }))

	render() {
		const {
			title,
			content,
			actions,
			contentTopPadding,
			expandable = true,
		} = this.props

		const titleEl = title ? (
			typeof title === 'string' ? (
				<Typography use="title" tag="h2">
					{title}
				</Typography>
			) : (
				title
			)
		) : null

		return (
			<AppCard>
				{expandable ? (
					<Ripple onClick={this.toggleExpansion}>
						<CardHeader>
							{titleEl}

							<FlexSpacer />

							<IconToggle
								checked={this.state.expanded}
								disabled={true}
								on={{ label: 'Collapse Card', content: 'arrow_drop_up' }}
								off={{ label: 'Expand Card', content: 'arrow_drop_down' }}
							/>
						</CardHeader>
					</Ripple>
				) : (
					<CardHeader>{titleEl}</CardHeader>
				)}

				{this.state.expanded ? (
					<React.Fragment>
						<CardContent
							topPadding={contentTopPadding}
							bottomPadding={!actions}
						>
							{content}
						</CardContent>

						{actions && actions.length ? (
							<CardActions>
								<CardActionButtons>{actions}</CardActionButtons>
							</CardActions>
						) : null}
					</React.Fragment>
				) : null}
			</AppCard>
		)
	}
}

const CardContent = styled.div`
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	padding: 0 1.5rem;

	${({ topPadding = true }) => topPadding && `padding-top: 1.5rem;`};

	${props => props.bottomPadding && `padding-bottom: 1.5rem;`};
`

const AppCard = styled(Card)`
	& + & {
		margin-top: 1.5rem;
	}
`

const CardHeader = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 0 1.5rem;
	cursor: pointer;
`

const FlexSpacer = styled.span`
	display: inline-block;
	flex: 1;
`
