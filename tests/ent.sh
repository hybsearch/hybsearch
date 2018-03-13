#!/bin/bash
set -e

for file in tests/ent/input/*; do
    filename="$(basename "$file")"
    echo "testing $filename"
    expectation="tests/ent/expected/$filename"
    scripts/convert-newick-tree-to-json.js < "$file" | scripts/ent.js - | diff "$expectation" -
done
