/* eslint-env jest */

const {hashNexusTreeNames} = require('../index')

test('emydura.nexus', () => {

	let content = `#NEXUS

Begin taxa;
	Dimensions ntax=10;
		Taxlabels
			Emydura_macquarii__KC755183
			Emydura_subglobosa__KC692462
			Emydura_subglobosa__KC755184
			Emydura_subglobosa__KC755185
			Emydura_subglobosa__KC755190
			Emydura_subglobosa__NC_026048
			Emydura_tanybaraga__KC755186
			Emydura_tanybaraga__KC755187
			Emydura_victoriae__KC755188
			Emydura_victoriae__KC755189
			;
End;
Begin trees;
	Translate
		   1 Emydura_macquarii__KC755183,
		   2 Emydura_subglobosa__KC692462,
		   3 Emydura_subglobosa__KC755184,
		   4 Emydura_subglobosa__KC755185,
		   5 Emydura_subglobosa__KC755190,
		   6 Emydura_subglobosa__NC_026048,
		   7 Emydura_tanybaraga__KC755186,
		   8 Emydura_tanybaraga__KC755187,
		   9 Emydura_victoriae__KC755188,
		  10 Emydura_victoriae__KC755189
;
tree STATE_10000000 = ((1:0.02156987859484087,(9:9.393059218339284E-4,10:9.393059218339284E-4):0.02063057267300694):0.029754076527042955,((((2:7.165330638729715E-6,6:7.165330638729715E-6):0.0038881480571106943,(7:0.0013917427687219232,8:0.0013917427687219232):0.0025035706190275012):0.003373646929203063,3:0.007268960316952487):0.02113686535323321,(4:0.019155265342032313,5:0.019155265342032313):0.009250560328153384):0.02291812945169813):0.0;
End;`

	let nameMap = {
		a: 'Emydura_macquarii__KC755183',
		b: 'Emydura_subglobosa__KC692462',
		c: 'Emydura_subglobosa__KC755184',
		d: 'Emydura_subglobosa__KC755185',
		e: 'Emydura_subglobosa__KC755190',
		f: 'Emydura_subglobosa__NC_026048',
		g: 'Emydura_tanybaraga__KC755186',
		h: 'Emydura_tanybaraga__KC755187',
		i: 'Emydura_victoriae__KC755188',
		j: 'Emydura_victoriae__KC755189',
	}

	const tree = hashNexusTreeNames(content, nameMap)
	expect(tree).toMatchSnapshot()
})
