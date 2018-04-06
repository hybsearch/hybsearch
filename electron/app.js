// @flow
/* globals SyntheticEvent */

import * as React from 'react'
import uniqueId from 'lodash/uniqueId'

import {
	Toolbar,
	ToolbarRow,
	ToolbarSection,
	ToolbarTitle,
	ToolbarIcon,
} from 'rmwc/Toolbar'
import { Ripple } from 'rmwc/Ripple'
import { IconToggle } from 'rmwc/IconToggle'
// import { Menu, MenuItem, MenuAnchor } from 'rmwc/Menu'
// import { Button } from 'rmwc/Button'
import { FormField } from 'rmwc/FormField'
import { Card, CardActions, CardAction, CardActionButtons } from 'rmwc/Card'
import { TextField } from 'rmwc/TextField'
import { ChipSet, Chip, ChipIcon, ChipText } from 'rmwc/Chip'
import { Select } from 'rmwc/Select'

import { List, SimpleListItem } from 'rmwc/List'
import { TabBar, Tab } from 'rmwc/Tabs'
import { Typography } from 'rmwc/Typography'

import styled from 'styled-components'

type AppProps = {}

type AppState = {
	server: WebSocket,
}

export class App extends React.Component<AppProps, AppState> {
	render() {
		return (
			<Container>
				<AppToolbar />

				<Content>
					<InputSection />
					<ProgressSection />
					<ResultSection />
				</Content>
			</Container>
		)
	}
}

const Container = styled.div``

const Content = styled.main`
	padding: 1.5rem;
`

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

// eslint-disable-next-line no-unused-vars
const PlainListItem = SimpleListItem

const ListItem = styled(SimpleListItem)`
	cursor: pointer;
`

type AppSectionProps = {
	title?: React.Node,
	content?: React.Node,
	actions?: Array<React.Node>,
	expanded?: boolean,
	contentTopPadding?: boolean,
	stroked?: boolean,
}

class AppSection extends React.Component<
	AppSectionProps,
	{ expanded: boolean }
> {
	static deriveStateFromProps(nextProps, prevState) {
		if (prevState.expanded === nextProps.expanded) {
			return
		}

		return { expanded: nextProps.expanded }
	}

	state = { expanded: Boolean(this.props.expanded) }

	handleToggle = ev => this.setState(() => ({ expanded: ev.detail.isOn }))
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

						{actions ? (
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

const InputSection = () => (
	<AppSection
		title="Input"
		expanded={true}
		contentTopPadding={false}
		content={
			<React.Fragment>
				<TabPanel
					render={({ activeTabIndex, onTabChange }) => (
						<React.Fragment>
							<TabBar activeTabIndex={activeTabIndex} onChange={onTabChange}>
								<Tab>Recent</Tab>
								<Tab>GenBank</Tab>
								<Tab>FASTA</Tab>
								<Tab>Newick Tree</Tab>
								<Tab>Newick (JSON)</Tab>
							</TabBar>

							{activeTabIndex === 0 ? <InputPanelRecent /> : null}
							{activeTabIndex === 1 ? <InputPanelFileGenbank /> : null}
							{activeTabIndex === 2 ? <InputPanelFileFasta /> : null}
							{activeTabIndex === 3 ? <InputPanelStringNewickTree /> : null}
							{activeTabIndex === 4 ? <InputPanelStringNewickJson /> : null}
						</React.Fragment>
					)}
				/>
			</React.Fragment>
		}
		actions={[<CardAction key="start">Start</CardAction>]}
	/>
)

const InputPanelRecent = () => {
	return (
		<React.Fragment>
			{/* <TextField box={true} withLeadingIcon="search" label="Search…" /> */}

			<React.Fragment>
				<Typography use="subheading1" tag="h3">
					Running
				</Typography>
				<List twoLine={true}>
					<ListItem
						text="emydura.gb (8fa76ba)"
						secondaryText="3 minutes ago"
						meta="info"
					/>
				</List>
			</React.Fragment>

			<React.Fragment>
				<Typography use="subheading1" tag="h3">
					Completed
				</Typography>
				<List twoLine={true}>
					<ListItem
						text="kino.gb (314ab53)"
						secondaryText="Yesterday – 7:00pm (23m)"
						meta="info"
					/>
					<ListItem
						text="kino.gb (5acd4fa)"
						secondaryText="2018/04/02 – 6:59pm (5m)"
						meta="info"
					/>
					<ListItem
						text="trio.gb (76fbcda)"
						secondaryText="2018/04/01 – 3:44am (16m)"
						meta="info"
					/>
				</List>
			</React.Fragment>
		</React.Fragment>
	)
}

class InputPanelFileGenbank extends React.Component<
	{},
	{
		inputId: string,
		selectedFile: string,
		selectedPipeline: string,
	}
> {
	state = {
		inputId: `file-input-${uniqueId()}`,
		selectedFile: '',
		selectedPipeline: '',
	}

	render() {
		const { inputId } = this.state
		return (
			<React.Fragment>
				<Select
					box={true}
					options={['BEAST', 'MrBayes', 'Newick']}
					label="Pipeline"
					placeholder="— Select One —"
					value={this.state.selectedPipeline}
					onChange={ev =>
						this.setState(() => ({ selectedPipeline: ev.currentTarget.value }))
					}
				/>

				<Select
					box={true}
					label="Data File"
					placeholder="— Select One —"
					value={this.state.selectedFile}
					onChange={ev =>
						this.setState(() => ({ selectedFile: ev.currentTarget.value }))
					}
					options={[
						'Local File',
						'emydura-short.gb',
						'emydura.gb',
						'kino.gb',
						'trio.gb',
					]}
				/>

				{this.state.selectedFile === 'Local File' ? (
					<FormField>
						<input type="file" id={inputId} />
						<label htmlFor={inputId}>Select a File</label>
					</FormField>
				) : null}
			</React.Fragment>
		)
	}
}

const InputPanelFileFasta = InputPanelFileGenbank

class InputPanelStringNewickTree extends React.Component<{}, {}> {
	render() {
		return <TextField textarea fullwidth label="Newick Tree" rows="8" />
	}
}

class InputPanelStringNewickJson extends React.Component<{}, {}> {
	render() {
		return (
			<TextField
				textarea
				fullwidth
				label="Newick Tree (JSON format)"
				rows="8"
			/>
		)
	}
}

const ProgressSection = () => (
	<AppSection
		title={
			<React.Fragment>
				<Typography use="title" tag="h2">
					Progress
				</Typography>
				<ChipSet>
					<Chip>
						<ChipIcon leading use="timer" />
						<ChipText>29 minutes 15 seconds</ChipText>
					</Chip>
				</ChipSet>
			</React.Fragment>
		}
		content={<React.Fragment>foo</React.Fragment>}
	/>
)

const ResultSection = () => (
	<React.Fragment>
		<ErrorSection />
		<NonmonophylySection />
		<PhylogramSection />
	</React.Fragment>
)

const ErrorSection = () => (
	<AppSection
		//stroked={true}
		title="Error"
		content={<React.Fragment>error</React.Fragment>}
	/>
)

const NonmonophylySection = () => {
	let results = [['Emydura_sub KC155', 'Emydura_Tany KC156']]
	let listItems = results.map(pair => (
		<ListItem key={pair.join()} meta="arrow_forward" text={pair.join(' ↔ ')} />
	))

	return <AppSection title="Nonmonophyly" content={<List>{listItems}</List>} />
}

const PhylogramSection = () => (
	<AppSection
		title="Phylogram"
		content={<React.Fragment>phylogram</React.Fragment>}
	/>
)

type TabPanelProps = {
	render: ({
		activeTabIndex: number,
		onTabChange: (ev: SyntheticEvent<HTMLInputElement>) => any,
	}) => React.Node,
}

type TabPanelState = {
	activeTabIndex: number,
}

class TabPanel extends React.Component<TabPanelProps, TabPanelState> {
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

const FixedToolbar = (props: any) => (
	<Toolbar fixed={true} {...props}>
		<ToolbarRow>{props.children}</ToolbarRow>
	</Toolbar>
)
const RaisedToolbar = styled(FixedToolbar)`
	position: relative;
`

const AppToolbar = () => (
	<RaisedToolbar>
		<ToolbarSection alignStart shrinkToFit>
			<ToolbarTitle>HybSearch</ToolbarTitle>
		</ToolbarSection>

		<ToolbarSection alignStart>
			<Select
				box={true}
				options={['thing3.CS', 'gpu.CS', 'thing3.CS (dev)', 'localhost']}
				label="Server"
			/>

			<ChipSet>
				<Chip>
					<ChipIcon leading use="cloud_off" />
					<ChipText>Down</ChipText>
				</Chip>
				<Chip>
					<ChipIcon leading use="cloud" />
					<ChipText>Up (3 days)</ChipText>
				</Chip>
			</ChipSet>
		</ToolbarSection>

		<ToolbarSection alignEnd shrinkToFit>
			<ToolbarIcon use="refresh" />
		</ToolbarSection>
	</RaisedToolbar>
)
