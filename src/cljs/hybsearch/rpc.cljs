(ns hybsearch.rpc
  (:require-macros
    [tailrecursion.javelin :refer [defc defc=]])
  (:require
   [tailrecursion.javelin :refer [cell-map]]
   [tailrecursion.castra :refer [mkremote]]
   [datascript :as d]))

(enable-console-print!)

(def schema {:clustal-scheme/name                  {:db/cardinality :db.cardinality/one}
             :clustal-scheme/ex-setting            {:db/cardinality :db.cardinality/one}
             :clustal-scheme/num-triples           {:db/cardinality :db.cardinality/one} ;; Always the same, equal to the number of triples that can be created for all loci
             :clustal-scheme/num-processed-triples {:db/cardinality :db.cardinality/one} ;; Depends on how well processed the global set is for this clustal scheme

             :analysis-set/name                    {:db/cardinality :db.cardinality/one}
             :analysis-set/set-def                 {:db/cardinality :db.cardinality/one :db/valueType :db.type/ref}
             :analysis-set/num-triples             {:db/cardinality :db.cardinality/one}
             :analysis-set/num-processed-triples   {:db/cardinality :db.cardinality/one}


             :job/name                             {:db/cardinality :db.cardinality/one}
             :job/set-def                          {:db/cardinality :db.cardinality/one :db/valueType :db.type/ref}
             :job/num-triples                      {:db/cardinality :db.cardinality/one}
             :job/num-processed-triples            {:db/cardinality :db.cardinality/one}
             :job/clustal-scheme                   {:db/cardinality :db.cardinality/one :db/valueType :db.type/ref}


             ;; Todo: how to match up relational ref ids when downloading data from server?

             ;; all triples for the set = triples(loci for each binomial UNION loci list) INTERSECT analysis-set triples
             :set-def/binomials                    {:db/cardinality :db.cardinality/many} ;; Currently a list of binomial species names
             :set-def/loci                         {:db/cardinality :db.cardinality/many} ;; Currently a list of accession numbers
             :set-def/analysis-set                 {:db/cardinality :db.cardinality/one :db/valueType :db.type/ref} ;; Optional, leave empty to indicate global analysis set, or if this is the set-def for an analysis set

             :locus/accession-num                  {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
             :locus/binomial                       {:db/cardinality :db.cardinality/one}

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


                {:db/id -90
                 :set-def/loci ["HM233091", "AB687524", "AB687525"]}

                {:db/id -100
                 :set-def/loci []}


                {:db/id -2
                 :job/name "Lepus 1"
                 :job/clustal-scheme -80
                 :job/set-def -90
                 :job/num-triples 1
                 :job/num-processed-triples 1}

                {:db/id -3
                 :job/name "Lepus 2"
                 :job/clustal-scheme -80
                 :job/set-def -90
                 :job/num-triples 1
                 :job/num-processed-triples 1}

                {:db/id -5
                 :analysis-set/name "A Set 1"
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

(d/transact! db seed-data)


(defc state {:random nil})
(defc error nil)
(defc loading [])

;; (defc= analysis-sets (d/q '[ :find ?e ?name ?processed ?total
;;                                :where [?e :analysis-set/name ?name]
;;                                       [?e :analysis-set/num-triples ?total]
;;                                       [?e :analysis-set/num-processed-triples ?processed]
;;                               ] @db))

;; Todo: wish there was a better way to query than just by name
;; Clustal Schemes
(defc= clustal-scheme-ids (d/q '[:find ?e :where [?e :clustal-scheme/name ?name]] @db))
(defc= clustal-schemes (map (fn [e] (d/entity @db (first e))) clustal-scheme-ids))

(defc selected-clustal-scheme-id (first (first @clustal-scheme-ids))) ;; Holds the id of the currently selected analysis set
(defc= selected-clustal-scheme (d/entity @db selected-clustal-scheme-id))

;; Analysis Sets
(defc= analysis-set-ids (d/q '[:find ?e :where [?e :analysis-set/name ?name]] @db))
(defc= analysis-sets (map (fn [e] (d/entity @db (first e))) analysis-set-ids))

(defc selected-analysis-set-id (first (first @analysis-set-ids))) ;; Holds the id of the currently selected analysis set
(defc= selected-analysis-set (d/entity @db selected-analysis-set-id) (fn [] (print analysis-sets)))

(print analysis-sets)
(print selected-clustal-scheme)
(print selected-analysis-set)





(defn init [])
