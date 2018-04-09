// @flow

import fs from 'fs'
import path from 'path'
import * as React from 'react'
import uniqueId from 'lodash/uniqueId'
import getFiles from '../lib/get-files'
import prettyMs from 'pretty-ms'

import { List, ListItem } from './components/material'
import { AppSection } from './components/app-section'

import { FormField } from 'rmwc/FormField'
import { CardAction } from 'rmwc/Card'
import { TextField } from 'rmwc/TextField'
import { Select } from 'rmwc/Select'

import { TabBar, Tab } from 'rmwc/Tabs'
import { Typography } from 'rmwc/Typography'

import type { Pipeline } from '../servers'
import type { SerializedJob } from '../../server/server/job'

type Props = {
	activeJobs: Array<SerializedJob>,
	completedJobs: Array<SerializedJob>,
	pipelines: Array<Pipeline>,
	onSubmit: ({
		pipeline: string,
		fileName: string,
		fileContents: string,
	}) => any,
	onChoose: ({ jobId: string }) => any,
	shouldClose: boolean,
}

type TabName =
	| 'Recent'
	| 'GenBank'
	| /* 'FASTA' | */ 'Newick Tree'
	| 'Newick (JSON)'

type State = {
	activeTabIndex: number,
	activeTabName: TabName,
	newickJson: string,
	newickTree: string,
	selectedPipeline: string,
	selectedFastaFile: string,
	selectedGenbankFile: string,
	selectedLocalFile: string,
}

export class InputSection extends React.Component<Props, State> {
	tabs: Array<TabName> = [
		'Recent',
		'GenBank',
		// 'FASTA',
		'Newick Tree',
		'Newick (JSON)',
	]

	state = {
		activeTabIndex: 0,
		activeTabName: this.tabs[0],
		selectedPipeline:
			this.props.pipelines && this.props.pipelines.length
				? this.props.pipelines[0].name
				: '',
		selectedGenbankFile: '--local--',
		selectedFastaFile: '--local--',
		selectedLocalFile: '',
		newickJson: '',
		newickTree: '',
	}

	static getDerivedStateFromProps = (props: Props, prevState: State) => {
		// this handles the changeover from the initial render, when
		// there aren't any pipelines, so selectedPipeline is empty
		if (
			prevState.selectedPipeline === '' &&
			props.pipelines &&
			props.pipelines.length
		) {
			return { selectedPipeline: props.pipelines[0].name }
		}

		return null
	}

	onTabChange = (ev: any) =>
		this.setState(() => ({
			activeTabIndex: ev.detail.activeTabIndex,
			activeTabName: this.tabs[ev.detail.activeTabIndex],
		}))

	renderTabPanel = () => {
		let { activeTabIndex, activeTabName } = this.state
		let { onChoose, activeJobs, completedJobs, pipelines } = this.props

		return (
			<React.Fragment>
				<TabBar
					activeTabIndex={activeTabIndex}
					onChange={this.onTabChange}
				>
					{this.tabs.map(name => <Tab key={name}>{name}</Tab>)}
				</TabBar>

				{activeTabName === 'Recent' ? (
					<InputPanelRecent
						onChoose={onChoose}
						recent={activeJobs}
						completed={completedJobs}
					/>
				) : activeTabName === 'GenBank' ? (
					<InputPanelFile
						pipelines={pipelines}
						selectedPipeline={this.state.selectedPipeline}
						onPipelineChange={this.storeSelectedPipeline}
						fileFilter={({ filename }) => filename.endsWith('.gb')}
						selectedFile={this.state.selectedGenbankFile}
						onFileChange={this.storeSelectedGenbankFile}
						onLocalFile={this.storeSelectedLocalFile}
					/>
				) : activeTabName === 'FASTA' ? (
					<InputPanelFile
						pipelines={pipelines}
						selectedPipeline={this.state.selectedPipeline}
						onPipelineChange={this.storeSelectedPipeline}
						fileFilter={({ filename }) =>
							filename.endsWith('.fasta')
						}
						selectedFile={this.state.selectedFastaFile}
						onFileChange={this.storeSelectedFastaFile}
						onLocalFile={this.storeSelectedLocalFile}
					/>
				) : activeTabName === 'Newick Tree' ? (
					<InputPanelStringNewickTree
						text={this.state.newickTree}
						onChange={this.storeNewickTree}
					/>
				) : activeTabName === 'Newick (JSON)' ? (
					<InputPanelStringNewickJson
						text={this.state.newickJson}
						onChange={this.storeNewickJson}
					/>
				) : (
					((activeTabName: empty), null)
				)}
			</React.Fragment>
		)
	}

	storeSelectedGenbankFile = (filePath: string) =>
		this.setState(() => ({ selectedGenbankFile: filePath }))

	storeSelectedFastaFile = (filePath: string) =>
		this.setState(() => ({ selectedFastaFile: filePath }))

	storeSelectedLocalFile = (filePath: string) =>
		this.setState(() => ({ selectedLocalFile: filePath }))

	storeSelectedPipeline = (pipelineName: string) =>
		this.setState(() => ({ selectedPipeline: pipelineName }))

	storeNewickTree = (text: string) =>
		this.setState(() => ({ newickTree: text }))

	storeNewickJson = (text: string) =>
		this.setState(() => ({ newickJson: text }))

	onSubmit = () => {
		let {
			selectedPipeline,
			selectedFastaFile,
			selectedGenbankFile,
			selectedLocalFile,
		} = this.state

		let filePath =
			selectedLocalFile || selectedGenbankFile || selectedFastaFile
		let fileContents = fs.readFileSync(filePath, 'utf-8')

		this.props.onSubmit({
			pipeline: selectedPipeline,
			fileName: path.basename(filePath),
			fileContents: fileContents,
		})
	}

	render() {
		// console.log(this.state)
		let { shouldClose } = this.props
		let { activeTabName } = this.state

		let startAction = (
			<CardAction onClick={this.onSubmit} key="start">
				Start
			</CardAction>
		)

		// we don't need the Start button on the recents list
		let actions = activeTabName === 'Recent' ? [] : [startAction]

		return (
			<AppSection
				title="Input"
				expanded={!shouldClose}
				contentTopPadding={false}
				content={this.renderTabPanel()}
				actions={actions}
			/>
		)
	}
}

const InputPanelRecent = (props: {
	recent: Array<SerializedJob>,
	completed: Array<SerializedJob>,
	onChoose: ({ jobId: string }) => any,
}) => {
	let { recent, completed, onChoose } = props

	return (
		<React.Fragment>
			{/* <TextField box={true} withLeadingIcon="search" label="Search…" /> */}

			{recent.length ? (
				<InputPanelRecentsList
					title="Running"
					jobs={recent}
					onChoose={onChoose}
				/>
			) : null}

			{completed.length ? (
				<InputPanelRecentsList
					title="Completed"
					jobs={completed}
					onChoose={onChoose}
				/>
			) : null}

			{!recent.length && !completed.length ? (
				<Typography use="subheading1" tag="h3">
					No completed jobs
				</Typography>
			) : null}
		</React.Fragment>
	)
}

const InputPanelRecentsList = (props: {
	jobs: Array<SerializedJob>,
	onChoose: ({ jobId: string }) => any,
	title: string,
}) => {
	let { jobs, onChoose, title } = props

	return (
		<React.Fragment>
			<Typography use="subheading1" tag="h3">
				{title}
			</Typography>
			<List twoLine={true}>
				{jobs
					.filter(job => !job.hidden)
					.map(job => (
						<InputPanelItem
							key={job.id}
							job={job}
							onChoose={onChoose}
						/>
					))}
			</List>
		</React.Fragment>
	)
}

const InputPanelItem = (props: {
	job: SerializedJob,
	onChoose: ({ jobId: string }) => any,
}) => {
	let { job, onChoose } = props

	let title = job.name ? (
		<span>
			{job.name} (<code>{job.id.substr(0, 7)}</code>)
		</span>
	) : (
		job.id
	)
	let duration = job.duration
		? prettyMs(job.duration)
		: 'problem with the duration'

	return (
		<ListItem
			key={job.id}
			text={title}
			secondaryText={duration}
			meta="info"
			onClick={() => onChoose({ jobId: job.id })}
		/>
	)
}

type FileInputPanelProps = {
	pipelines: Array<Pipeline>,
	selectedFile: string,
	selectedPipeline: string,
	onPipelineChange: string => any,
	onFileChange: string => any,
	onLocalFile: string => any,
	fileFilter: ({ filename: string, filepath: string }) => boolean,
}

type FileInputPanelState = {
	inputId: string,
	localFiles: Array<{ filename: string, filepath: string }>,
}

class InputPanelFile extends React.Component<
	FileInputPanelProps,
	FileInputPanelState
> {
	state = {
		inputId: `file-input-${uniqueId()}`,
		localFiles: getFiles().filter(this.props.fileFilter),
	}

	render() {
		const { inputId } = this.state

		return (
			<React.Fragment>
				<Select
					options={this.props.pipelines.map(p => p.name)}
					label="Pipeline"
					value={this.props.selectedPipeline}
					onChange={ev =>
						this.props.onPipelineChange(ev.currentTarget.value)
					}
				/>

				<Select
					label="Data File"
					value={this.props.selectedFile}
					onChange={ev =>
						this.props.onFileChange(ev.currentTarget.value)
					}
					options={[
						{ value: '--local--', label: 'Local File' },
						...this.state.localFiles.map(entry => ({
							value: entry.filepath,
							label: entry.filename,
						})),
					]}
				/>

				{this.props.selectedFile === '--local--' ? (
					<FormField>
						<input
							type="file"
							id={inputId}
							onChange={ev =>
								this.props.onLocalFile(
									ev.currentTarget.files[0].path
								)
							}
						/>
						<label htmlFor={inputId}>Select a File</label>
					</FormField>
				) : null}
			</React.Fragment>
		)
	}
}

type TextInputPanelProps = {
	text: string,
	onChange: string => any,
}

class InputPanelStringNewickTree extends React.Component<TextInputPanelProps> {
	render() {
		return (
			<TextField
				textarea
				fullwidth
				label="Newick Tree (non-JSON)"
				rows="8"
				value={this.props.text}
				onChange={ev => this.props.onChange(ev.currentTarget.value)}
			/>
		)
	}
}

class InputPanelStringNewickJson extends React.Component<TextInputPanelProps> {
	render() {
		return (
			<TextField
				textarea
				fullwidth
				label="Newick Tree (JSON format)"
				rows="8"
				value={this.props.text}
				onChange={ev => this.props.onChange(ev.currentTarget.value)}
			/>
		)
	}
}
