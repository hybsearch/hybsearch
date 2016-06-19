## To install

- os x:
	- install homebrew: `<https://brew.sh>`
	- install node: `brew install node`
	- install things: `brew install homebrew/science/beagle --with-opencl`
	- install openmpi: `brew install openmpi`

- windows:
	- install chocolaty: `<https://chocolatey.org>`
	- install git, python, and node: `choco install -y git python2 nodejs.install vcredist2013`


pipeline:

	cat data/emydura-short.gb \
		| ./bin/genbank-fasta.js - \
		| ./bin/clustal-o.js - \
		| ./bin/fasta-to-nexus.js - \
		| ./bin/mrbayes.js - \
		| ./bin/consensus-newick.js - \
		| ./bin/newick-json.js - \
		| ./ent.js -

to convert files:

	./vendor/seqmagick/cli.py convert --input-format fasta --output-format nexus --alphabet dna <input> <output>



## How to update Electron:

- `npm install -g electron-download`
- `electron-download --version=<version>`
- Copy the zip from `~/.electron` and extract it into `hybsearch/vendor`
- Update hybsearch/electron to point to the new path
- Remove the old folder



    >>> hamming-distance speciesA speciesB
    $minimumDistance
    >>> estimate-generations $minimumDistance
    {divergenceTime, generationCount}
    >>> seq-gen $file --generations $generationCount
    $sequences > sequences.fasta
    >>> hamdis sequences.fasta
    ???
