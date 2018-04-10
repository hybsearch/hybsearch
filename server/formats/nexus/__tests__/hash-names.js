/* eslint-env jest */

const { hashNexusTreeNames } = require('../index')

test('emydura.nexus', () => {
	let content = `#NEXUS

Begin taxa;
	Dimensions ntax=10;
		Taxlabels
			Emydura_macquarii
			Emydura_subglobosa
			Emydura_tanybaraga
			Emydura_victoriae
			;
End;
Begin trees;
	Translate
		   1 Emydura_macquarii,
		   2 Emydura_subglobosa,
		   3 Emydura_tanybaraga,
		   4 Emydura_victoriae
;
tree STATE_0 = ((1[&dmv=0.022160000660789422]:0.02229904566199236,4[&dmv=0.022160000660789422]:0.02229904566199236)[&dmv=0.022160000660789422]:0.029438265490644572,(2[&dmv=0.022160000660789422]:0.0071863359974703046,3[&dmv=0.022160000660789422]:0.0071863359974703046)[&dmv=0.022160000660789422]:0.04455097515516663)[&dmv=0.022160000660789422];
End;`

	let nameMap = {
		a: 'Emydura_macquarii__KC755183',
		b: 'Emydura_subglobosa__KC692462',
		c: 'Emydura_tanybaraga__KC755186',
		d: 'Emydura_victoriae__KC755188',
	}

	const tree = hashNexusTreeNames(content, nameMap)
	expect(tree).toMatchSnapshot()
})
