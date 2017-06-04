> A tool to find nonmonophyly in a phylogenetic tree.

## To Install

- install homebrew: `<https://brew.sh>`
- install node: `brew install node`
- install things: `brew install homebrew/science/beagle --with-opencl`
- install openmpi: `brew install open-mpi`

## To Run
Either double-click the "hybsearch" file in the folder, or, with a terminal, `cd` into the hybsearch folder and run `./hybsearch`.

---

## Miscallaneous Bits

Our current versions of our dependencies:

- Node: 7.9.0
- Beagle: 2.1.2
- OpenMPI: 2.1.1
- Clustal-Omega (included): 1.2.0
- MrBayes (inlcuded): 3.2.6
- Electron (included): 1.6.10
- seq-gen (included): 1.3.3
- seqmagick (included): 0.6.1

pipeline:

```shell
cat data/emydura-short.gb \
	| ./bin/genbank-fasta.js - \
	| ./bin/clustal-o.js - \
	| ./bin/fasta-to-nexus.js - \
	| ./bin/mrbayes.js - \
	| ./bin/consensus-newick.js - \
	| ./bin/newick-json.js - \
	| ./ent.js -
```

to convert files:

```shell
./vendor/seqmagick/cli.py convert --input-format fasta --output-format nexus --alphabet dna <input> <output>
```


## How to update Electron:

- `npm install -g electron-download`
- `electron-download --version=<version>`
- Copy the zip from `~/.electron` and extract it into `hybsearch/vendor`
- Edit the `hybsearch` file to point to the new path
- Remove the old folder


```
>>> hamming-distance speciesA speciesB
$minimumDistance
>>> estimate-generations $minimumDistance
{divergenceTime, generationCount}
>>> seq-gen $file --generations $generationCount
$sequences > sequences.fasta
>>> hamdis sequences.fasta
???
```
