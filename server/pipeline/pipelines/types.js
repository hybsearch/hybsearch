// @flow

export type PipelineStage = {
	input: Array<string>,
	transform: (Array<any>) => Array<any>,
	output: Array<string>,
}

export type Pipeline = Array<PipelineStage>

export type PipelineRecord = {
	name: string,
	pipeline: Pipeline,
}
