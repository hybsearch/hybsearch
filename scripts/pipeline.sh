#!/bin/bash

set -e

function pipeline() {
	file=$1
	echo "$file"
	BASE=$(basename "$file" ".gb")

	echo "genbank-to-fasta"
	time scripts/convert-genbank-to-fasta.js "$file" > "data/$BASE.fasta"
	echo "clustal"
	time scripts/clustal.js "data/$BASE.fasta" > "data/$BASE.aln.fasta"
	echo "fasta-to-nexus"
	time scripts/convert-fasta-to-nexus.js "data/$BASE.aln.fasta" > "data/$BASE.aln.nexus"
	echo "mrbayes"
	time scripts/mrbayes.js "data/$BASE.aln.nexus" > "data/$BASE.tree.nexus"
	echo "consensus-tree"
	time scripts/convert-consensus-tree-to-newick.js "data/$BASE.tree.nexus" > "data/$BASE.tree"
	echo "tree-to-json"
	time scripts/convert-newick-to-json.js "data/$BASE.tree" > "data/$BASE.tree.json"

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
