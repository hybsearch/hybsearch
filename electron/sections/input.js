// @flow

import * as React from 'react'
import uniqueId from 'lodash/uniqueId'

import { List, ListItem } from './components/material'
import { AppSection } from './components/app-section'

import { FormField } from 'rmwc/FormField'
import { CardAction } from 'rmwc/Card'
import { TextField } from 'rmwc/TextField'
import { Select } from 'rmwc/Select'

import { TabBar, Tab } from 'rmwc/Tabs'
import { Typography } from 'rmwc/Typography'
import { TabPanel } from './components/tab-panel'

export const InputSection = () => (
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
