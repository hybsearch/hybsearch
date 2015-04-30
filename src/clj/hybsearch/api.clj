(ns hybsearch.api
  (:require [tailrecursion.castra :refer [defrpc]]))


(def seed-locus-data [
                {:db/id -20
                 :locus/accession-num "HM233091"
                 :locus/binomial      "Lepus mandshuricus"}
                {:db/id -21
                 :locus/accession-num "AB687524"
                 :locus/binomial      "Lepus timidus"}
                {:db/id -22
                 :locus/accession-num "AB687525"
                 :locus/binomial      "Lepus timidus"}])


(def seed-jobs-data [
                {:db/id -1
                 :clustal-scheme/name       "Scheme 1"
                 :clustal-scheme/ex-setting "Example Option 1"
                 :clustal-scheme/num-triples 900
                 :clustal-scheme/num-processed-triples 23
                 } ;; Todo: Maybe even allow people to view and manage their clustal schemes separately from analysis sets

                {:db/id -80
                 :clustal-scheme/name       "Scheme 2"
                 :clustal-scheme/ex-setting "Example Option 2"
                 :clustal-scheme/num-triples 900
                 :clustal-scheme/num-processed-triples 67
                 }

                ;; This will act as the set def for one of our example analysis sets
                {:db/id -90
                 :set-def/loci ["HM233091", "AB687524", "AB687525"]}

                ;; This will be the set def for our example jobs
                {:db/id -1000
                 :set-def/binomials ["Lepus timidus", "Lepus mandshuricus"]
                 :set-def/filter -90}

                {:db/id -100
                 :set-def/loci []}


                {:db/id -2
                 :job/name "Lepus 1"
                 :job/clustal-scheme -1
                 :job/set-def -1000
                 :job/num-triples 1
                 :job/num-processed-triples 1}

                {:db/id -3
                 :job/name "Lepus 2"
                 :job/clustal-scheme -1
                 :job/set-def -1000
                 :job/num-triples 1
                 :job/num-processed-triples 1}

                {:db/id -5
                 :analysis-set/name "Set 1"
                 :analysis-set/jobs [-2, -3]
                 :analysis-set/clustal-scheme -80
                 :analysis-set/set-def -90
                 :analysis-set/num-triples 1
                 :analysis-set/num-processed-triples 1}

                {:db/id -4
                 :analysis-set/name "Empty Set"
                 :analysis-set/jobs []
                 :analysis-set/clustal-scheme -1
                 :analysis-set/set-def -100
                 :analysis-set/num-triples 0
                 :analysis-set/num-processed-triples 0}

                ])


(defrpc get-jobs-state []
  {:rpc/query [{:entities seed-jobs-data}]} nil)


(defrpc create-clustal-scheme [clustal-scheme] {} nil)
(defrpc create-analysis-set [analysis-set] {} nil)
(defrpc upload-loci [loci] {} nil)


;; (defrpc diffs-since [version]
;;   {:rpc/query [{:diffs seed-data
;;                 :source-version version
;;                 :dest-version 1}]} nil)

