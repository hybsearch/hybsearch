// @flow
// Hamming distances script
//
// usage: ./hammingDistance infile.fa

// infile must be FASTA format and is expected to contain pairs of sequences to be compared
// all sequences must also have been previously aligned so the Hamming distance calculations are correct

const getData = require('./get-data')
const zip = require('lodash/zip')
const _min = require('lodash/min')
const _max = require('lodash/max')
const _mean = require('lodash/mean')

// Find Hamming distance between two sequences
// Takes input of a two locations for sequences to compare
function hamming(dna1 /*: string */, dna2 /*: string */) /*: number */ {
    // console.log(dna1)
    // console.log(dna2)

	let count = 0

	for (let [a, b] of zip([...dna1], [...dna2])) {
        // console.log(a, b)
		if (a !== b) {
			count += 1
		}
	}

	// console.log("sequence length:", dna1.length)
	return count
}

// Estimate number of generations based on 2% mutation rate,
// generation length of 10 years, and population size 100.
// This is used in the SeqGen input
function estimate_gen(ham /*: number */, len /*: number */) /*: number */ {
	let gen_length = 10 // these inputs may want to be made flexible
	let mut_rate = 0.02 // this as well
	let pop_size = 100 // this as well

	// Find percentage different:
	let percent = ham / len
	console.log('percent:', percent)

	// Find divergence time in millions of years:
	let divtime = percent / mut_rate
	console.log('divtime:', divtime)

	// Lastly, find number of generations
	let gen = divtime * 1000000 / gen_length
	return gen
}

// Take in FASTA file
function run(input) {
	// if (argc < 2) {
	//     cerr << " Wrong format: " << argv[0] << " [infile] " << endl;
	//     return -1;
	// }

	// ifstream input(argv[1]);
	// if (!input.good()) {
	//     cerr << "Error opening: " << argv[1] << " . You have failed." << endl;
	//     return -1;
	// }

	let id = ''
	let DNA_sequence = ''

	let ham1 = ''
	let ham2 = ''

	let index = 0
	let counter = -1 // counts number of id's found in while loop (# of sequences)

	// this should contain the total number of comparisons, should probably be an input for the size of this array (here it is 1)
	let distances /*: Array<number> */ = []

	for (let line of input.split('\n')) {
		// line may be empty so you *must* ignore blank lines
		// or you have a crash waiting to happen with line[0]
		if (!line.trim().length) continue

		if (line[0] === '>') {
			// output previous line before overwriting id
			// but ONLY if id actually contains something
			if (id !== '') {
				// add in the below line to print out sequences
				console.log(id, ':', DNA_sequence)
				if (counter == -1) continue
				if ((counter == 0) || (counter % 2 == 0)) {
					ham1 = DNA_sequence
					// below output is to test for this step occurring properly.
					// cout << "hi! it's me!" << endl;
				} else {
					ham2 = DNA_sequence
					let out = hamming(ham1, ham2)
					console.log('hamming distance:', out)
					distances.push(out)
					index += 1
				}
			}
			id = line.substr(1)
			DNA_sequence = ''
			counter += 1
		} else {
			DNA_sequence += line
		}
	}

	// output final entry
	// but ONLY if id actually contains something
	if (id !== '') {
		// add in line below if you want to print out line
		console.log(id, ":", DNA_sequence);
		if (counter % 2 === 1) {
			ham2 = DNA_sequence
			let out = hamming(ham1, ham2)
			console.log('final hamming distance:', out)
			distances.push(out)
		}
	}

    console.log('distances', distances)

	// Find minimum
	let small = _min(distances)
	console.log('minimum hamming distance:', small)

	// Find maximum
	let big = _max(distances)
	console.log('maximum hamming distance:', big)

	// Find average
	let avg = _mean(distances)
	console.log('average hamming distance:', avg)

	// Find estimation of generations
	let gen = estimate_gen(distances[0], 527) //527 is estimated seq. length
	console.log('generation count:', gen)
}

function main() {
	let file = process.argv[2]

	if (!file && process.stdin.isTTY) {
		console.error('usage: node hamming-distance-2.js (<input> | -)')
		process.exit(1)
	}

	return getData(file)
		.then(run)
		.catch(console.error.bind(console))
}

if (require.main === module) {
	main()
}
