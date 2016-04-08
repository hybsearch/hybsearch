#!/bin/sh

for file in data/*.gb; do
	echo "$file"
	BASE=$(basename "$file" ".gb")
	TIME=/usr/bin/time
	# CLUSTAL=/Users/hawken/Downloads/clustal-omega-1.2.1/compiled/bin/clustalo

	{
		echo "genbank-to-fasta"
		$TIME bin/genbank-fasta.js    "$file"                     > "data/$BASE.fasta"
		echo "clustal"
		$TIME bin/clustal-o.js        "data/$BASE.fasta"          > "data/$BASE.aln.fasta"
		# $TIME $CLUSTAL --in "data/$BASE.fasta" --out "data/$BASE.aln.fasta" --force --threads=8
		echo "fasta-to-nexus"
		$TIME bin/fasta-to-nexus.js   "data/$BASE.aln.fasta"      > "data/$BASE.aln.nexus"
		echo "mrbayes"
		$TIME bin/mrbayes.js          "data/$BASE.aln.nexus"      > "data/$BASE.tree.nexus"
		echo "consensus-tree"
		$TIME bin/consensus-newick.js "data/$BASE.tree.nexus"     > "data/$BASE.tree"
		echo "tree-to-json"
		$TIME bin/newick-json.js      "data/$BASE.tree" > "data/$BASE.tree.json"
	}
	echo
done
