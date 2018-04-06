// @flow

import * as React from 'react'

import { AppSection } from './components/app-section'

export const ErrorSection = () => (
	<AppSection
		//stroked={true}
		title="Error"
		content={<React.Fragment>error</React.Fragment>}
	/>
)
