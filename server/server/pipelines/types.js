// @flow

export type PipelineStage = {
	input: Array<string>,
	transform: (Array<any>) => Array<any>,
	output: Array<string>,
}

export type SerializedPipelineStage = {
	input: Array<string>,
	output: Array<string>,
}

export type Pipeline = Array<PipelineStage>

export type PipelineRecord = {
	name: string,
	pipeline: Pipeline,
}

export type SerializedPipelineRecord = {
	name: string,
	pipeline: Array<SerializedPipelineStage>,
}
