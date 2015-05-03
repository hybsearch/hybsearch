(ns hybsearch.api
  (:require [clojure.java.io :as io]
            [clojure.string :as s]
            [hybsearch.db.crud :as crud]
            [hybsearch.db.init :as db-init])
  (:import [org.biojava.nbio.core.sequence.io GenbankReaderHelper
                                               GenbankSequenceParser
                                               DNASequenceCreator]
            [org.biojava.nbio.core.sequence.compound DNACompoundSet])
  )

;; Note: In the version of BioJava that we currently use (4.0.0), the GenbankReaderHelper
;; only reads the first record out of a given file. The code to read multiple records
;; has already been commited to the BioJava GitHub repo, but that hasn't made it into the
;; latest Jar available on Maven. Watch the codebase for a future release, then rewrite the
;; internals of the upload-sequences function when you update the version of BioJava
;; used to compile this application, if that update includes the multiple-record code.
;; See the commit here: https://github.com/stefanharjes/biojava/commit/c860f193f4bb76f34f0bcaf7cbac7c0d98d04883

;; -----------------------------------------------------
;;  RPC for mutating the database
;; -----------------------------------------------------

(defonce db (atom nil))

(defn if-not-db-init []
  (if (not @db) (reset! db (db-init/init-db))))

;; Reads the sequences out of a GenBank file and formats them for entry into the database.
(defn upload-sequences [gb-file]
    (if-not-db-init)
  ;; Todo: This is probably inefficient in terms of memory.
  ;; See the iota libray (lib for fast mapreduce on text files)
  ;; for a brief expl. of why. Might want to switch to that as
  ;; a later optimization.
  ;;

  ;; Todo: This currently expects genbank records to be
  ;; separated by //\n, and then another blank line.
  ;; Make it more robust so that it can separate on //\n.
  ;; (we currently do it this way because we get a degenerate
  ;; record at the end if we use //\n, since the file ends with a newline).
  (let [sequences
        (let [filestr (slurp gb-file)]
            (map
              (fn [entry] {:accession ((re-find #"ACCESSION\s*(\S*)" entry) 1)
                           :binomial ((re-find #"ORGANISM\s*(.*)" entry) 1)
                           :definition ((re-find #"DEFINITION([\s\S]*)ACCESSION" entry) 1)
                           :sequence (s/replace
                                       ((re-find #"ORIGIN\s*\n([\s\S]*)" entry) 1)
                                       #"[\d\s\n\/]"
                                       "")})
              (s/split filestr #"//\n")))]
        (crud/create-sequences @db sequences)))




;; -----------------------------------------------------
;; -----------------------------------------------------

(def seed-sequence-data [
                {:db/id -20
                 :sequence/accession     "HM233091"
                 :sequence/binomial      "Lepus mandshuricus"}
                {:db/id -21
                 :sequence/accession     "AB687524"
                 :sequence/binomial      "Lepus timidus"}
                {:db/id -22
                 :sequence/accession     "AB687525"
                 :sequence/binomial      "Lepus timidus"}])


(def seed-jobs-data [
                {:db/id -1
                 :clustalscheme/name       "Scheme 1"
                 :clustalscheme/exsetting "Example Option 1"
                 :clustalscheme/numtriples 900
                 :clustalscheme/numproc 23
                 } ;; Todo: Maybe even allow people to view and manage their clustal schemes separately from analysis sets

                {:db/id -80
                 :clustalscheme/name       "Scheme 2"
                 :clustalscheme/exsetting "Example Option 2"
                 :clustalscheme/numtriples 900
                 :clustalscheme/numproc 67
                 }

                ;; This will act as the set def for one of our example analysis sets
                {:db/id -90
                 :setdef/sequences ["HM233091", "AB687524", "AB687525"]}

                ;; This will be the set def for our example jobs
                {:db/id -1000
                 :setdef/binomials ["Lepus timidus", "Lepus mandshuricus"]
                 :setdef/filter -90}

                {:db/id -100
                 :setdef/sequences []}


                {:db/id -2
                 :job/name "Lepus 1"
                 :job/clustalscheme -1
                 :job/setdef -1000
                 :job/numtriples 1
                 :job/numproc 1}

                {:db/id -3
                 :job/name "Lepus 2"
                 :job/clustalscheme -1
                 :job/setdef -1000
                 :job/numtriples 1
                 :job/numproc 1}

                {:db/id -5
                 :analysisset/name "Set 1"
                 :analysisset/jobs [-2, -3]
                 :analysisset/clustalscheme -80
                 :analysisset/setdef -90
                 :analysisset/numtriples 1
                 :analysisset/numproc 1}

                {:db/id -4
                 :analysisset/name "Empty Set"
                 :analysisset/jobs []
                 :analysisset/clustalscheme -1
                 :analysisset/setdef -100
                 :analysisset/numtriples 0
                 :analysisset/numproc 0}

                ])


; Todo: Fix later
(defn get-jobs-state []
  {:entities seed-jobs-data})


(defn create-clustalscheme [clustalscheme] nil)
(defn create-analysisset [analysisset] nil)



;; (defrpc diffs-since [version]
;;   {:rpc/query [{:diffs seed-data
;;                 :source-version version
;;                 :dest-version 1}]} nil)

