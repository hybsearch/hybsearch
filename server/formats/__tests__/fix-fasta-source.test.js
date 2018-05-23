/* eslint-env jest */

const { fixFastaSource } = require('../fix-fasta-source')
const { parseFasta } = require('../fasta/parse')

test('processes a fasta input file', () => {
	let input = `>HQ012626.1 Trionyx triunguis voucher Tt24 cytochrome b (cytb) gene, partial cds; mitochondrial
------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------
-------------------ACTAACCATAGCCACCGCATTCATAGGATACGTACTACCAT
GAGGGCAAATATCCTTCTGAGG------GGCCACCGTAATCACAAACCTACTATCAGCCG
TCCCCTATATCGGCACCACAATAGTACAATGGGTCTGAGGAGGCTTCTCCGTAGACAATG
CCA---------CCCTAAC---------------ACGA---------TTCTTCACCATAC
ACTTCCTACTTCCATTCATAATCGCAGGAATAACCATAGT--ACATCTACTATTCCTACA
CGAAACTGGATCAAACAACCCAATAGGACTTAACTCAAACACAGACAAAATCCC-GTTCC
ATCCCTACTTCTCATACAAAGACCTACTGGGCCTAACTGTAATACTAACCACACTACTAT
CTATCGCCATATTTTACCCAAACCTATTGGGGGACCCAGACAACTTCACGCCAGCCAACC
CACTATCCACCCCGCCCCACATCAAACCAGAATGATACTTTCTATTCGCATATGCCATCT
TACGATCAATCCCAAACAAATTAGGCGGAGTCCTAGCCTTACTACTATCCATCCTAGTGC
TATTCACCCTCCCCATAGTCCACACATCAAAACAACGAACACTTACCTTCCGACCAATCA
CCCAAACCTTATTCTGACTATTCGTAGCCAACCTAATAGTACTGACATGAATTGGAGGTC
AACCAGTAGAAAACCCATTCATTCTTATCGGACAAACAGCCTCCATCCTCTATTTCCTAA
TCTTACTCGTACTAATACC-----------------------------------------
-----------------------------
>HQ012625.1 Trionyx triunguis voucher Tt23 cytochrome b (cytb) gene, partial cds; mitochondrial
------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------
------------------------------------------------------------
-------------------ACTAACCATAGCCACCGCATTCATAGGATACGTACTACCAT
GAGGGCAAATATCCTTCTGAGG------GGCCACCGTAATCACAAACCTACTATCAGCCG
TCCCCTATATCGGCACCACAATAGTACAATGGGTCTGAGGAGGCTTCTCCGTAGACAATG
CCA---------CCCTAAC---------------ACGA---------TTCTTCACCATAC
ACTTCCTACTTCCATTCATAATCGCAGGAATAACCATAGT--ACATCTACTATTCCTACA
CGAAACTGGATCAAACAACCCAATAGGACTTAACTCAAACACAGACAAAATCCC-GTTCC
ATCCCTACTTCTCATACAAAGACCTACTGGGCCTAACTGTAATACTAACCACACTACTAT
CTATCGCCATATTTTACCCAAACCTATTGGGGGACCCAGACAACTTCACGCCAGCCAACC
CACTATCCACCCCGCCCCACATCAAACCAGAATGATACTTTCTATTCGCATATGCCATCT
TACGATCAATCCCAAACAAATTAGGCGGAGTCCTAGCCTTACTACTATCCATCCTAGTGC
TATTCACCCTCCCCATAGTCCACACATCAAAACAACGAACACTTACCTTCCGACCAATCA
CCCAAACCTTATTCTGACTATTCGTAGCCAACCTAATAGTACTGACATGAATTGGAGGTC
AACCAGTAGAAAACCCATTCATTCTTATCGGACAAACAGCCTCCATCCTCTATTTC----
------------------------------------------------------------
-----------------------------
`
	let output = fixFastaSource(input)
	expect(output).toMatchSnapshot()
})

test('leaves a file with nice accession numbers alone', () => {
	let input = `> Emydura_subglobosa__KC755190
-ggaacaataaattatcacctcaaaagacacataaaaccacaggaaccccta-ctcaaccataaaaaacacaaatccact
attaaaaatcattaacaacacctttattgatctccccaccccatctaacatctctactttatgaaactttggttcattac
taggggcatgcctcattctacaactagccacaggaatcttcttagctatacactactcatctgatatttccatagcattc
tcatcaatctcccacatccaacgagacgttcaatatggctgactaattcgaaatatacacgctaacggtgcttcattatt
ctttatatgcatttacctccatattggacgaggaatctactacggttcatacctttacaagaaaacctgaaacactggag
taatattactactcctagtcatagccactgcattcgtgggctacgtactaccatgaggacaaatatcattctgaggagct
acagtaatcaccaatctcctatcagccattccatatgtaggccctacacttgtagaatgaatttgaggggggttctccgt
agataacgccacccttacccgattctttacattccacttcctaatcccattcgccatcctaggaataactatactacatc
tactactactacatgaaacaggatcaaacaacccaacaggactaaactcaaactgtgacaaaatcccattccacccatat
ttctcctataaagatctactaggccttattctaataataacactcctactcacccttaccctattctaccctaacctact
aggagatccagacaactttacaccagccaacccactaaccacc
> Emydura_victoriae__KC755189
ggaacaatcaattattaccccacaaagacacataaaaccacaggaacccctactccaaccataaaaaacacaaatccact
attaaaaatcattaacaacaccttcgttgatcttcccaccccatccaacatctccgctttatgaaacttcggatcattac
taggagcatgcctcattctacaactagccacaggaatcttcttagctatacactactcatccgacatttctacagcattc
tcatcaatttcccacatccaacgagatgttcaatatggatgacttattcgaaatatacacgccaacggtgcttcattatt
ctttatatgcatctaccttcatattggacgagggatctactacggttcctacctttacaacaaaacctgaaacactggag
taatattactactcctagttatagccactgcattcgtgggctacgtgctaccatgaggccaaatatcattctgaggggct
acagtaatcaccaacctattatcagccattccatacgtaggcccaacacttgtagagtggatttgaggagggttctccgt
agacaacgctactcttactcgattcttcacatttcactttctaatcccattcgccatcctaggaataaccctactacacc
tcctacttctacacgaaacaggatcaaacaacccaacaggactaaactcaaactgtgacaaaatcccattccacccatat
ttctcgtataaagacctactaggcctcatcctaataattatatgtctactcacccttaccctatttcacccaaacctact
aggagatccagacaactttacaccagccaatccactaaccacc`
	let output = fixFastaSource(input)
	expect(output).toBe(input)
})

test('leaves properly-formatted identifiers alone', () => {
	let ident = 'Trionyx_triunguis__HQ012626'
	let input = `>${ident}
-------------------ACTAACCATAGCCACCGCATTCATAGGATACGTACTACCAT`
	let output = fixFastaSource(input)
	expect(parseFasta(output)[0].species).toBe(ident)
})

test('formats an accession+species identifier (where the accession has a period)', () => {
	let input = `>HQ012626.1 Trionyx triunguis voucher Tt24 cytochrome b (cytb) gene, partial cds; mitochondrial
-------------------ACTAACCATAGCCACCGCATTCATAGGATACGTACTACCAT`
	let output = fixFastaSource(input)
	expect(parseFasta(output)[0].species).toBe('Trionyx_triunguis__HQ012626x1')
})

test('formats an accession+species identifier', () => {
	let input = `>HQ012626 Trionyx triunguis voucher Tt24 cytochrome b (cytb) gene, partial cds; mitochondrial
-------------------ACTAACCATAGCCACCGCATTCATAGGATACGTACTACCAT`
	let output = fixFastaSource(input)
	expect(parseFasta(output)[0].species).toBe('Trionyx_triunguis__HQ012626')
})

test('formats an accession-only identifier (with a period)', () => {
	let input = `>HQ012626.1
-------------------ACTAACCATAGCCACCGCATTCATAGGATACGTACTACCAT`
	let output = fixFastaSource(input)
	expect(parseFasta(output)[0].species).toBe('HQ012626x1')
})

test('formats an accession-only identifier', () => {
	let input = `>HQ012626
-------------------ACTAACCATAGCCACCGCATTCATAGGATACGTACTACCAT`
	let output = fixFastaSource(input)
	expect(parseFasta(output)[0].species).toBe('HQ012626')
})

test('removes entries labelled "UNVERIFIED"', () => {
	let input = `>JN232531.1 UNVERIFIED: Lissemys punctata andersoni cytochrome b-like (cytb) gene, partial sequence; mitochondrial
-------CTAATTGATCTCCAACCCATCTAACATCTCAACATGATGAAAC-TTCGGATCT
>JN232533.1 Pelochelys cantorii cytochrome b (cytb) gene, partial cds; mitochondrial
----------------------------------------------TCAAATTATTAACA`
	let output = fixFastaSource(input)
	expect(parseFasta(output)[0].species).toBe('Pelochelys_cantorii__JN232533x1')
})
