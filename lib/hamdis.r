### Seq-Gen output analysis
### CIR Project
### Advisors: Steve Freedberg, Matthew Richey

#######installing packages:
if (!require('seqinr')) {
	install.packages('seqinr', repos="http://cran.rstudio.com/")
	library('seqinr')
}
if (!require('mosaic')) {
	install.packages('mosaic', repos="http://cran.rstudio.com/")
	install.packages('mosaicData', repos="http://cran.rstudio.com/")
	library('mosaic')
}


printf <- function(...) cat(sprintf(...))


##################################################
# We want to compare the two individuals to find a Hamming
# distance between them. That is, how many base pairs differ
# between the two sequences.

# To do this, we must compare each base pair, one at a time.
# Let's make a function for comparing the pieces of the string:
Hamming <- function (x,y) {
 # note that the parameters x and y should be
 counter <- 0   # to track the number of base pairs different
 index <- 1     # to keep track of indices in for loop
 for (i in x) {
   if (i != y[index]) {
     counter <- counter + 1
   }
   index <- index + 1
 }
 return(counter)    #returns number of base pairs that differ
}



LoadDataFromFile <- function(fname) {
  ##################################################
  # Generalizing to Larger Files
  # The above code works for a file of only two individuals, but
  # we wish to generalize this so that it can be used for multiple
  # pairs of individuals and store the appropriate data.

  # Note that for now, we will assume that all sequences in a
  # single file have the same length.

  ### First Steps
  # read in the data:
  data <- read.fasta(file=fname, as.string=TRUE)

  # get the number of sequences included in the data
  len <- length(data)

  # create a vector of every other integer up to len for the loop
  list <- seq(1, len, 2)

  # store the original names of the sequences:
  orig_names <- names(data)


  ##################################################
  # We create a for loop to cycle through the pairs and compare
  # each one. The loop will record its findings in a list called `out`.

  # out is initialized with fillers
  out <- seq(1:(len/2))

  for (i in list) {
   names(data)[i] <- "indiv1"
   names(data)[i+1] <- "indiv2"
   length <- nchar(data$indiv1[1])
   taxon1 <- substring(data$indiv1[1], seq(1,length,1), seq(1,length,1))
   taxon2 <- substring(data$indiv2[1], seq(1,length,1), seq(1,length,1))
   index <- (i-1)/2 + 1
   out[index] <- Hamming(taxon1, taxon2)
  }

  # Now "out" is filled with Hamming distances of all pairs


  ##################################################
  # Simple Statistics from the data:
  avgOfRange <- mean(out)      # average
  minOfRange <- min(out)       # minimum of range
  maxOfRange <- max(out)       # maximum of range
  percent <- (avgOfRange / len)


  printf("avg=%d\n", avgOfRange)
  printf("min=%d\n", minOfRange)
  printf("max=%d\n", maxOfRange)
  printf("percent=%f\n", percent)

  printf("start data\n")
  print(out)    # desired output
}



EstimateGenerations <- function(genlength, percent) {
  ##################################################
  ##################################################
  # Estimating Generations:
  # Assume 2% per million years (standard for cytochrome B)
  # mutation rate. This allows us to calculate a likely divergence
  # time, from which we can estimate generations:

  # divergence time in million years
  divtime <- percent/0.02
  printf("divtime=%d\n", divtime)

  # number of generations (used for seq gen parameters)
  gen <- divtime*1000000/genlength
  printf("gen=%d\n", gen)
}




PrintUsage <- function() {
  write("usage: Rscript hamdis.r <command> <args>", stdout())
  write("commands:", stdout())
  write("  estimate <generation length> <percentage>", stdout())
  write("  calculate <filename> <something else>", stdout())
  quit()
}


args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 3) {
  PrintUsage()
}

command <- args[1]
if (command == "estimate") {
  genlength <- as.numeric(args[2])
  percent <- as.numeric(args[3])
  EstimateGenerations(genlength, percent)
} else if (command == "calculate") {
  filename <- args[2]
  other <- args[3]
  LoadDataFromFile(filename)
} else {
  PrintUsage()
}
