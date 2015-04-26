(ns hybsearch.rpc
  (:require-macros
    [tailrecursion.javelin :refer [defc defc=]])
  (:require
   [tailrecursion.javelin]
   [tailrecursion.castra :refer [mkremote]]
   [datascript :as d]))

(def schema {:analysis-set/name           {:db/cardinality :db.cardinality/one}
             :analysis-set/loci           {:db/cardinality :db.cardinality/many}
             :analysis-set/clustal-scheme {:db/cardinality :db.cardinality/one  :db/valueType :db.type/ref}
             :analysis-set/jobs           {:db/cardinality :db.cardinality/many :db/valueType :db.type/ref}
             :analysis-set/num-triples    {:db/cardinality :db.cardinality/one}
             :analysis-set/num-processed-triples {:db/cardinality :db.cardinality/one }

             :job/name                    {:db/cardinality :db.cardinality/one }
             :job/loci                    {:db/cardinality :db.cardinality/many}
             :job/num-triples             {:db/cardinality :db.cardinality/one }
             :job/num-processed-triples   {:db/cardinality :db.cardinality/one }
             :job/analysis-set            {:db/cardinality :db.cardinality/one :db/valueType :db.type/ref}

             :clustal-scheme/ex-setting   {:db/cardinality :db.cardinality/one}

             :locus/accession-num         {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
             :locus/binomial              {:db/cardinality :db.cardinality/one}

             ;; Todo: Eventually allow more locus information on client.
             ;; There is also more species information than the binomial available in the GenBank files, i.e. the ncbi_taxid
             ;; Will probably also need to enforce uniqueness on the clustal-schemes
             })

(defonce db (d/create-conn schema))

(def seed-data [
                {:db/id -20
                 :locus/accession-num "HM233091"
                 :locus/binomial      "Lepus mandshuricus"}
                {:db/id -21
                 :locus/accession-num "AB687524"
                 :locus/binomial      "Lepus timidus"}
                {:db/id -22
                 :locus/accession-num "AB687525"
                 :locus/binomial      "Lepus timidus"}

                {:db/id -1
                 :clustal-scheme/ex-setting "Example Option 1"} ;; Todo: Maybe even allow people to view and manage their clustal schemes separately from analysis sets

                {:db/id -80
                 :clustal-scheme/ex-setting "Example Option 2"}

                {:db/id -2
                 :job/name "Lepus 1"
                 :job/loci ["HM233091", "AB687524", "AB687525"]
                 :job/analysis-set -4
                 :job/num-triples 1
                 :job/num-processed-triples 1}

                {:db/id -3
                 :job/name "Lepus 2"
                 :job/loci ["HM233091", "AB687524", "AB687525"]
                 :job/analysis-set -4
                 :job/num-triples 1
                 :job/num-processed-triples 1}

                {:db/id -5
                 :analysis-set/name "A Set 1"
                 :analysis-set/jobs [-2, -3]
                 :analysis-set/clustal-scheme -80
                 :analysis-set/loci ["HM233091", "AB687524", "AB687525"]
                 :analysis-set/num-triples 1
                 :analysis-set/num-processed-triples 1}

                {:db/id -4
                 :analysis-set/name "Empty Set"
                 :analysis-set/jobs []
                 :analysis-set/clustal-scheme -1
                 :analysis-set/loci []
                 :analysis-set/num-triples 0
                 :analysis-set/num-processed-triples 0}






                ])

(d/transact! db seed-data)


(defc state {:random nil})
(defc error nil)
(defc loading [])

(defc= analysis-sets (d/q '[ :find ?e ?name ?processed ?total
                               :where [?e :analysis-set/name ?name]
                                      [?e :analysis-set/num-triples ?total]
                                      [?e :analysis-set/num-processed-triples ?processed]
                              ] @db))

(defc selected-analysis-set-id (first (first @analysis-sets))) ;; Holds the id of the currently selected analysis set
(defc= selected-analysis-set (d/entity @db selected-analysis-set-id))


(enable-console-print!)




(defn init [])
