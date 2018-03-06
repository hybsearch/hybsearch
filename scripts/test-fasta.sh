#!/bin/bash

DIRECTORY=$(dirname $0)

echo "testing fasta/build.js"
node "$DIRECTORY/../tests/fasta/build.js"

echo "testing fasta/parse.js"
node "$DIRECTORY/../tests/fasta/parse.js"
