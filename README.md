# hybsearch
[![Build Status](https://travis-ci.org/hybsearch/hybsearch.svg?branch=master)](https://travis-ci.org/hybsearch/hybsearch)

> A tool to find nonmonophyly in a phylogenetic tree.

## To Install

- install homebrew: `<https://brew.sh>`
- install docker: `brew install docker-ce`
-

## To Run
Either double-click the "hybsearch" file in the folder, or, with a terminal, `cd` into the hybsearch folder and run `./hybsearch`.

You will also need to run the following to start the server process that does the data manipulation:

```
docker run --port 8080:8080 -it hybsearch/hybsearch
```

- TODO: Allow pointing the local electron client app at a remote server container. 
- TODO: Support automatically starting the server process if it's not running. 

---

## Miscallaneous Bits

Our current versions of our dependencies:

- Docker: 17.20.x

Or

- Node: 9.5.x
- Beagle: 2.1.2
- OpenMPI: 2.1.1
- Clustal-Omega (included): 1.2.0
- MrBayes (included): 3.2.6
- Electron (included): 1.6.10
- seqmagick (included): 0.6.1

If you have Docker installed, all you need to do is (in the project root)

```
$ docker run --port 8080:8080 -it hybsearch/hybsearch
$ ./hybsearch
```

which will start the server that the electron app uses.

If you don't have docker, TBD. If you're on Windows, TBA. 

## Misc Notes

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
