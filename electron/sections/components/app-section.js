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
	stroked?: boolean,
}

type State = { expanded: boolean }

export class AppSection extends React.Component<Props, State> {
	static deriveStateFromProps(nextProps: Props, prevState: State) {
		if (prevState.expanded === nextProps.expanded) {
			return
		}

		return { expanded: nextProps.expanded }
	}

	state = { expanded: Boolean(this.props.expanded) }

	handleToggle = (ev: any) =>
		this.setState(() => ({ expanded: ev.detail.isOn }))
	toggleExpansion = () =>
		this.setState(state => ({ expanded: !state.expanded }))

	render() {
		const { title, content, actions, contentTopPadding, stroked } = this.props
		return (
			<AppCard stroked={stroked}>
				<Ripple onClick={this.toggleExpansion}>
					<CardHeader>
						{title ? (
							typeof title === 'string' ? (
								<Typography use="title" tag="h2">
									{title}
								</Typography>
							) : (
								title
							)
						) : null}

						<FlexSpacer />

						<IconToggle
							checked={this.state.expanded}
							disabled={true}
							on={{ label: 'Collapse Card', content: 'arrow_drop_up' }}
							off={{ label: 'Expand Card', content: 'arrow_drop_down' }}
						/>
					</CardHeader>
				</Ripple>

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
