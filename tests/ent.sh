#!/bin/bash
set -e

for file in tests/ent/input/*; do
    filename="$(basename "$file")"
    echo "testing $filename"
    expectation="tests/ent/expected/$filename"
    ./bin/newick-json.js < "$file" | ./lib/ent.js - | diff "$expectation" -
done
