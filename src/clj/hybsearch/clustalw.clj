(ns clustalw-interface.clustalw
  (:require [clojure.java.shell :refer [sh]]
            [clojure.java.io :as io])
  (:import [java.lang.Runtime]))

;; Todo: Figure out how to run it off of a specified
;; file path. For now, we just rely on the fact that
;; it's in my path.

; :sequencetype
; :alignmenttype
; :pwdnamatrix
; :pwgapopen
; :pwgapext
; :ktuple
; :window
; :topdiags
; :pairgap
; :dnamatrix
; :gapopen
; :gapext
; :gapdist
; :endgaps "true/false"
; :iteration
; :numiter
; :clustering
; :kimura "true/false"

;; 1) Write sequences to a temporary FASTA file
;; 2) Run clustalw with that file as input, (?) specify a temporary output file
;; 3) (?) Scrape scores off of the process's output stream
;; 4) Use clustalw's temporary output file to generate a tree

;; Clustal doesn't appear to care if we exceed 80 characters per line in a FASTA file,
;; it still produced the same results however the sequence was split up in my experiments
;; (obviously not a comprehensive test, but it's probably ok not to bother enforcing the 80 char/line limit)

;; Takes a File object and a vector of sequence maps
;; and prints the sequences to the file in FASTA format
(defn write-fasta [file sequences]
  (with-open [writer (io/writer file)]
    (doseq [s sequences]
      (.write writer (str ">" (:accession s) "\n" (:sequence s) "\n")))))

(defn arg-string [kw setting]
  (case kw
    :sequencetype  (str "-type=" setting)
    :alignmenttype (if (= setting "fast") "-quicktree" nil)
    :pwdnamatrix   (str "-pwdnamatrix=" setting)
    :pwgapopen     (str "-pwgapopen=" setting)
    :pwgapext      (str "-pwgapext=" setting)
    :ktuple        (str "-ktuple=" setting)
    :window        (str "-window=" setting)
    :topdiags      (str "-topdiags=" setting)
    :pairgap       (str "-pairgap=" setting)
    :dnamatrix     (str "-dnamatrix=" setting)
    :gapopen       (str "-gapopen=" setting)
    :gapext        (str "-gapext=" setting)
    :gapdist       (str "-gapdist=" setting)
    :endgaps       (str "-endgaps=" setting)
    :iteration     (str "-iteration=" setting)
    :numiter       (str "-numiter=" setting)
    :clustering    (str "-clustering=" setting)
    :kimura        (if (= setting "true") "-kimura" nil)))

(defn build-args [options]
  (reduce-kv (fn [result kw setting]
               (let [arg (arg-string kw setting)]
                 (if-not (nil? arg) (conj result arg) result)))
             [] options))

;; Runs clustalw with the specified options
(defn run-clustalw [args]
  (apply sh (into [] (concat ["clustalw"] args))))

;; Returns a tree in this format [[accession dist] [accession dist] [accession dist]]
;; Where accession is a string and dist is a float
(defn clustalw-tree [sequences options]
  (let [infile   (java.io.File/createTempFile "inf" ".fas")
        alnfile  (java.io.File/createTempFile "aln" ".aln")]
    ;; Write sequences to the temporary input file
    (write-fasta infile sequences)
    ;; Run clustalw first to align
    (run-clustalw (into [] (concat ["-align"
                                    "-quiet"
                                    (str "-infile=" (.getAbsolutePath infile))
                                    (str "-outfile=" (.getAbsolutePath alnfile))]
                                   (build-args options))))
    ;; Then run again to get tree
    (run-clustalw (into [] (concat ["-tree"
                                    "-quiet"
                                    (str "-infile=" (.getAbsolutePath alnfile))]
                                   (build-args options))))
    ;; Read distances for each sequence out of the tree file
    (let [alnfilepath (.getAbsolutePath alnfile)
          ;; Cut the .aln off of the aln file and replace with .ph to get
          ;; the output file path for the tree.
          treefilepath (str (subs alnfilepath 0 (- (count alnfilepath) 4)) ".ph")
          ]
      ;; Parse tree and convert distance strings to floats
      (map (fn [x] (let [v (clojure.string/split x #":")]
                      (assoc v 1 (java.lang.Float/parseFloat (nth v 1)))))
        (->
          (slurp treefilepath)
          (clojure.string/replace #"[\n\(\);]" "")
          (clojure.string/split #","))))))

;; Takes the output of clustalw-tree and converts it to the internal,
;; grouped representation, as a vector, flattened and with distances removed.
(defn internal-tree [c-tree]
  (let [sorted (sort-by last c-tree)
        dist0 (nth (nth sorted 0) 1)
        dist1 (nth (nth sorted 1) 1)
        dist2 (nth (nth sorted 2) 1)
        grouped (if (< (java.lang.Math/abs (- dist0 dist1))
                       (java.lang.Math/abs (- dist1 dist2)))
                  (reverse sorted)
                  sorted)]
    (mapv #(nth % 0) grouped)))

;; Gets tree with example data and default options
(defn testrun []
  (let [options {:sequencetype     "DNA" ;; (called "type" on command line)
                 :alignmenttype    "slow" ;; (specify "quicktree" if fast)
                 :pwdnamatrix      "iub"
                 :pwgapopen        "10"
                 :pwgapext         "0.10"
                 :ktuple           "1"
                 :window           "5"
                 :topdiags         "5"
                 :pairgap          "3"
                 :dnamatrix        "iub"
                 :gapopen          "10"
                 :gapext           "0.20"
                 :gapdist          "5"
                 :endgaps          "false" ;; true/false (leave flag out of command if false)
                 :iteration        "none"
                 :numiter          "1"
                 :clustering       "NJ"
                 :kimura           "false"
                 } ;; true/false (leave flag out of command if false)
        A { :accession "DQ793161" :binomial "Lepus mandshuricus" :sequence "atgaccaatcccgtgcgccctcaccccctacaaaaacttggtaaccactcccgaattgaccttcccgcccccgctcgcatttcagcctgatgaaactttggctccctattaggactatgcctaataatccaaatcctcactggcctattcctccatataccatacacattcgacacagcaacagcattttcttcaatcacacatatttgccaagacgtaaactatggctgacttaatcgttacctgccggccgatgaagcatcaatattttttatctgcttatatctacctgtaggtcgggaaaactactaccccacagatacgtacataaaaacctggaatattgccattattctattatttgccccgcgcgcaaactcagttatgggctatgttcccccatgaggaccaatatcaatgtgaggcccttctgcatgtacgagtctttcatatcctatcccctagattggaacatgcctagttgaatgaatttgtttccgatttcctgtcgacaaagctaccctcacccgattcttcgctttccacttcattctccctttcatcatcgccgatgtacagatgagtcacttacttttactccctgaccatggctaccctaacctctcagagagcctctcacactccgataagaatcacttccagctccataaccaagttacggaccttcaaagaatcctcggacatatactcctactcatacacctagtcctattctcctccgagcgtgaaggagaccccgacaactactcccctgccaatcctctcagcattactcacccagtaaaacctggatggtatttgacatttgcttacgccattttacgctctagccctaactgactggtaggtgttcgagacccagttatagcaattctcattcaagcaattatccccttcgtccacatatccaaacaacgcagcataatattccgaccgattagccaagtggtgttgagaatcctcgttgcagaccttctaacactcacatggatcggaggacaaccagttgaacacccacctattgatattggacaaggagcatctagcacgaacttctctatcatccttatccttataccccttgcaagcttaattgagaataaaagcattcaaggaagg" }
        B { :accession "AB687534" :binomial "Lepus coreanus"     :sequence "atgaccaacattcgtaaaactcatcccctactaaaaattgttaaccactccctaattgaccttcccgccccctcaaacatctcagcctgatgaaactttggctccctattaggactatgcctaataatccaaatcctaactggcctgttcctagccatacactacacatcagacacagcaacagcattttcttcagtcacacatatttgccgagacgtaaaccatggctgacttattcgttacctgcacgccaatggggcatcaatattttttatctgcttatatatacatgtaggtcgtggaatctactacggctcatatacttacctagaaacctggaatattggcattattctactatttgcagtaatagccacagcatttataggctatgttctcccatgaggacaaatatcattctgaggcgctactgtaattaccaatcttttatcagctatcccctacattggaacaaccctagttgaatgaatttgaggaggattttcagtcgacaaagctacactcacccgattcttcgctttccacttcattctcccattcatcatcgcagcactagtgatgattcacttacttttcctccatgaaactggctccaataacccatcaggtatcccatcagactctgataagattccattccacccctattacacaattaaagaccttctaggatttctcgtacttatcctcctactcatactcctagtcttattctcccctgaccttctcggagacccagacaactacacccctgccaatcctctcaacactcctccccacatcaaacctgaatggtattttctattcgcctacgccattttacgctcgatccctaacaaactaggaggtgttctagccctagttatatcaattctcatcctagcaattatccccttcctccacatatccaaacaacgcagcataatattccgaccgattagccaagttctcttctgaatcctcgttgcagaccttctaacactcacatggatcggagggcaaccagttgaacacccatttattactattgggcaagtagcatctatcctttacttctctatcatccttatccttataccccttgcaagcttaattgagaataaaatccttaaatgaagg" }
        C { :accession "AB687533" :binomial "Lepus coreanus"     :sequence "atgaccaacattcgtaaaactcatcccctactaaaaattgttaaccactccctaattgaccttcccgccccctcaaacatctcagcctgatgaaactttggctccctattaggactatgcctaataatccaaatcctaactggcctgttcctagccatacactacacatcagacacagcaacagcattttcttcagtcacacatatttgccgagacgtaaaccatggctgacttattcgttacctgcacgccaatggggcatcaatattttttatctgcttatatatacatgtaggtcgtggaatctactacggttcatatacttacctagaaacctggaatattggcattattctactatttgcagtaatagccacagcatttataggctatgttctcccatgaggacaaatatcattctgaggcgctactgtaattaccaatcttttatcagctatcccctacattggaacaaccctagttgaatgaatttgaggaggattttcagtcgacaaagctacactcacccgattcttcgctttccacttcattctcccattcatcatcgcagcactagtgatgattcacttacttttcctccatgaaactggctccaataacccatcaggtatcccatcagactctgataagattccattccacccctattacacaattaaagaccttctaggatttctcgtacttatcctcctactcatactcctagtcttattctcccctgaccttctcggagacccagacaactacacccctgccaatcctctcaacactcctccccacatcaaacctgaatggtattttctattcgcctacgccattttacgctcgatccctaacaaactaggaggtgttctagccctagttatatcaattctcatcctagcaattatccccttcctccacatatccaaacaacgcagcatagtattccgaccgattagccaagttctcttctgaatcctcgttgcagaccttctaacactcacatggatcggagggcaaccagttgaacacccatttattactattgggcaagtagcatctatcctttacttctctatcatccttatccttataccccttgcaagcttaattgagaataaaatccttaaatgaagg" }
        ]
    (println (internal-tree (clustalw-tree [A B C] options)))
    ))