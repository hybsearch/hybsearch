# hybsearch
[![Build Status](https://travis-ci.org/hybsearch/hybsearch.svg?branch=master)](https://travis-ci.org/hybsearch/hybsearch)

> A tool to find nonmonophyly in a phylogenetic tree.


## To Install
- install docker: [docker.com](https://store.docker.com/search?type=edition&offering=community) or `brew install docker-ce` (with <https://brew.sh> installed)


## To Run
Two steps:

1. Either double-click the "hybsearch" file in the folder, or, with a terminal, `cd` into the hybsearch folder and run `./hybsearch`.
2. Run `docker run -p 8080:8080 -t hybsearch/hybsearch`

If you don't have docker, TODO.

If you're on Windows, TODO.


## To Develop
You'll need Docker, still.

### For the Electron app
Any changes you make to the JS can be run by simply pressing <kbd>⌘R</kbd>. There is no build process.

### For the Docker container / data pipeline
Whenever you change the data pipeline, you will need to rebuild the Docker image.

We recommend using a local Docker tag to test with; anywhere you write `hybsearch/hybsearch`, you should just write `hybsearch` instead.

To rebuild the container:

```
docker build -t hybsearch .
```

To run your rebuilt container:

```
docker run -p 8080:8080 -t hybsearch
```


## Miscallaneous Bits

### Dependencies

Our current versions of our dependencies:

- Docker: 17.20.x

Or

- Node: 8.x
- Beagle: 2.1.2
- OpenMPI: 2.1.1
- Clustal-Omega: 1.2.0
- MrBayes: 3.2.6
- Electron: 1.6.10
- seq-gen: 1.3.3
- seqmagick: 0.6.1

If you have Docker installed, all you need to do is (in the project root)

```
$ docker run --port 8080:8080 -t hybsearch/hybsearch
$ ./hybsearch
```

which will start the server that the electron app uses.


### To convert files:

```shell
./vendor/seqmagick/cli.py convert --input-format fasta --output-format nexus --alphabet dna <input> <output>
```

### How to update Electron:

- `npm install -g electron-download`
- `electron-download --version=<version>`
- Copy the zip from `~/.electron` and extract it into `hybsearch/vendor`
- Edit the `hybsearch` file to point to the new path
- Remove the old folder

### Some HammingDistance Notes:

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
