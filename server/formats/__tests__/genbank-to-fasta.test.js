/* eslint-env jest */

const genbankToFasta = require('../genbank-to-fasta')
const hashNames = require('../fasta/hash-names')
const fs = require('fs')
const path = require('path')

const base = path.join(__dirname, 'input')
const files = fs.readdirSync(base).filter(f => f.endsWith('.gb'))

for (const file of files) {
	test(file, () => {
		const content = fs.readFileSync(path.join(base, file), 'utf-8')
		const tree = genbankToFasta(content, hashNames(content))
		expect(tree).toMatchSnapshot()
	})
}

test('accounts for multiple spaces in the species name', () => {
	let input = `
ACCESSION   AB817079
  ORGANISM  Panthera   pardus orientalis
            Eukaryota; Metazoa; Chordata; Craniata; Vertebrata; Euteleostomi;
            Mammalia; Eutheria; Laurasiatheria; Carnivora; Feliformia; Felidae;
            Pantherinae; Panthera.
ORIGIN
        1 ccatccaaca tctcaacatg atggaacttt ggctccctat taggggtatg tttaatccta`

	expect(genbankToFasta(input)).toMatchSnapshot()
})

test('handles URLs with // in them', () => {
	let input = `
ACCESSION   AB817079
  ORGANISM  Panthera pardus orientalis
            Eukaryota; Metazoa; Chordata; Craniata; Vertebrata; Euteleostomi;
            Mammalia; Eutheria; Laurasiatheria; Carnivora; Feliformia; Felidae;
            Pantherinae; Panthera.
  JOURNAL   Submitted (10-APR-2013) Contact:Taro Sugimoto Graduate School of
            Environmental Science Hokkaido University, Devision of
            Environmental Science Creation; Kitaku kita 10-jou nishi 5-chome,
            Sapporo, Hokkaido 060-0810, Japan
  URL       :http://www.ees.hokudai.ac.jp/
ORIGIN
        1 ccatccaaca tctcaacatg atggaacttt ggctccctat taggggtatg tttaatccta`

	expect(genbankToFasta(input)).toMatchSnapshot()
})
