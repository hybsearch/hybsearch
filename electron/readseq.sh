#!/bin/bash

java -cp vendor/readseq.jar run -v -format=phylip "$1"
