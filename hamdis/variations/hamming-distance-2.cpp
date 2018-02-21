// Hamming distances script
//
// usage: ./hammingDistance infile.fa
//
// infile must be FASTA format and is expected to contain pairs of sequences to be compared
// all sequences must also have been previously aligned so the Hamming distance calculations are correct

#include <iostream>
#include <fstream>
#include <algorithm>
#include <string>
using namespace std;

// Find Hamming distance between two sequences
// Takes input of a two locations for sequences to compare
int hamming(string dna1, string dna2) {
	int len;
	len = dna1.length();
	int count = 0;
	for (int i=0; i<len; ++i) {
		if(dna1[i] != dna2[i])
			++count;
	}
	// cout << "sequence length: " << len << endl;
	return count;
}

// Estimate number of generations based on 2% mutation rate,
// generation length of 10 years, and population size 100.
// This is used in the SeqGen input
double estimate_gen(int ham, int len) {
    double gen_length = 10; // these inputs may want to be made flexible
    double mut_rate = 0.02; // this as well
    double pop_size = 100;  // this as well
    // Find percentage different:
    double percent;
    percent = (ham/len);
    cout << "percent: " << percent << endl;
    // Find divergence time in millions of years:
    double divtime;
    divtime = percent/mut_rate;
    cout << "divtime: " << divtime << endl;
    // Lastly, find number of generations
    double gen;
    gen = (divtime*1000000)/gen_length;
    return gen;
}


// Take in FASTA file
// argc & argv are standard for using command line to input files
int main(int argc, char **argv) {
    if (argc < 2) {
        cerr << " Wrong format: " << argv[0] << " [infile] " << endl;
        return -1;
    }

    ifstream input(argv[1]);
    if (!input.good()) {
        cerr << "Error opening: " << argv[1] << " . You have failed." << endl;
        return -1;
    }
    string line, id, DNA_sequence;
    string ham1, ham2;
    int counter = -1;  // counts number of id's found in while loop (# of sequences)
    int out;
    int pop_size = 100;
    int index = 0;
    int *distances;
    distances = new int[1]; // this should contain the total number of comparisons, should probably be an input for the size of this array (here it is 1)
    //don't loop on good() as below comment, it does not allow for EOF
    //while (std::getline(input, line).good()) {
    while (getline(input, line)) {
        // line may be empty so you *must* ignore blank lines
        // or you have a crash waiting to happen with line[0]
        if(line.empty())
            continue;
        if (line[0] == '>') {
            // output previous line before overwriting id
            // but ONLY if id actually contains something
            if(!id.empty()) {
            	// add in the below line to print out sequences
                // cout << id << " : " << DNA_sequence << endl;
                if(counter == -1)
                	continue;
                if(counter == 0 | counter%2 == 0) {
                	ham1 = DNA_sequence;
                	// below output is to test for this step occurring properly.
                	// cout << "hi! it's me!" << endl;
                }
                else {
                	ham2 = DNA_sequence;
                	out = hamming(ham1, ham2);
                	cout << "hamming distance: " << out << endl;
                	distances[index] = out;
                	++index;
                }
            }
            id = line.substr(1);
            DNA_sequence.clear();
            ++counter;
        }
        else {
            DNA_sequence += line;
        }
    }
    // output final entry
    // but ONLY if id actually contains something
    if(!id.empty()) {
    	// add in line below if you want to print out line
        // cout << id << " : " << DNA_sequence << endl;
        if(counter%2 == 1) {
        	ham2 = DNA_sequence;
        	out = hamming(ham1, ham2);
        	cout << "final hamming distance: " << out << endl;
        	distances[index+1] = out;
        }
    }
    // Find minimum
    int small = distances[1];
    for (int i=0; i < (sizeof(distances)/sizeof(*distances)); ++i) {
    	if (distances[i] < small)
    		small = distances[i];
    }
    cout << "minimum hamming distance: " << small << endl;
    // Find maximum
    int big = distances[1];
    for (int i=0; i < (sizeof(distances)/sizeof(*distances)); ++i) {
    	if (distances[i] > big)
    		big = distances[i];
    }
    cout << "maximum hamming distance: " << big << endl;
    // Find average
    int sum = distances[1];
    for (int i=0; i < (sizeof(distances)/sizeof(*distances)); ++i) {
    	sum += distances[i];
    }
    sum /= (sizeof(distances)/sizeof(*distances));
    cout << "average hamming distance: " << sum << endl;
    // Find estimation of generations
    double gen;
    gen = estimate_gen(distances[0], 527); //527 is estimated seq. length
    cout << "generation length: " << gen << endl;
    return 0;
}
