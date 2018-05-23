/* eslint-env jest */

const { fixFastaSource } = require('../fix-fasta-source')
const { parseFasta } = require('../fasta/parse')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, 'input')
const files = fs.readdirSync(base).filter(f => f.endsWith('.fasta'))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file), 'utf-8')
		const tree = fixFastaSource(content)
		expect(tree).toMatchSnapshot()
	})
}

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
