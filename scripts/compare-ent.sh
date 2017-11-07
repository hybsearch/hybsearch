#!/bin/bash

set -e

function pipeline() {
	file=$1
	echo "$file"
	BASE=$(basename "$file" ".gb")

	echo "genbank-to-fasta"
	time bin/genbank-fasta.js    "$file"                     > "data/$BASE.fasta"
	echo "clustal"
	time bin/clustal-o.js        "data/$BASE.fasta"          > "data/$BASE.aln.fasta"
	# time $CLUSTAL --in "data/$BASE.fasta" --out "data/$BASE.aln.fasta" --force --threads=8
	echo "fasta-to-nexus"
	time bin/fasta-to-nexus.js   "data/$BASE.aln.fasta"      > "data/$BASE.aln.nexus"
	echo "mrbayes"
	time bin/mrbayes.js          "data/$BASE.aln.nexus"      > "data/$BASE.tree.nexus"
	echo "consensus-tree"
	time bin/consensus-newick.js "data/$BASE.tree.nexus"     > "data/$BASE.tree"
	echo "tree-to-json"
	time bin/newick-json.js      "data/$BASE.tree" > "data/$BASE.tree.json"

	echo
}

if test $# -ge 1; then
	files=$*
else
	files=$(ls data/*.gb)
fi

for f in $files; do
	pipeline "$f"
done
