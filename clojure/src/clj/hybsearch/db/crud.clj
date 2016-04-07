(ns hybsearch.db.crud
  (:require [monger.core :as mg]
            [monger.collection :as mc]
            [monger.operators :refer :all]
            [hybsearch.db.collections :as coll])
  (:import org.bson.types.ObjectId))

;; As a note, it is recommended to always store new documents with the :_id key set,
;; since the Monger driver will have to mutate the document, which given
;; Clojure's immutable data structures might result in behavior the MongoDB authors
;; did not anticipate.



;; IMPORTANT TODO:
;; PossibleTodo: Add Validateur for data validation on create methods
;; Implement validations as separate methods for each document type (not internal to any crud methods)


;; Note: All of these methods take Clojure data structures as arguments.


;; ------------------------
;;  Sequences
;; ------------------------

;; Sequences are unique by accession number.
;; We do not yet allow deletion (this will have to sync to deletions
;; on associated collections if we ever do it).

;; Returns write result
(defn create-sequence-ret [db sequence]
  (mc/insert-and-return db coll/sequences sequence))

(defn read-sequence-by-accession [db accession]
  (mc/find-one-as-map db coll/sequences {:accession accession}))

(defn read-sequence-by-id [db id]
  (mc/find-map-by-id db coll/sequences id))

(defn read-sequences-by-accessions [db accs]
  (mc/find-maps db coll/sequences {:accession {$in accs}}))

(defn read-sequence-accessions [db]
  (mc/distinct db coll/sequences :accession))

(defn read-sequence-ids [db]
  (mc/distinct db coll/sequences :_id))


;; ------------------------
;;  Clustal Schemes
;; ------------------------

(defn create-clustal-scheme [db scheme]
  (mc/insert db coll/clustal-schemes scheme))

(defn read-clustal-scheme-by-id [db id]
  (mc/find-map-by-id db coll/clustal-schemes id))

(defn read-clustal-schemes [db]
  (mc/find-maps db coll/clustal-schemes))

(defn read-clustal-scheme-ids [db]
  (mc/distinct db coll/clustal-schemes :_id))


;; ------------------------
;;  Analysis Sets
;; ------------------------

(defn create-analysis-set [db analysis-set]
  (mc/insert db coll/analysis-sets analysis-set))

(defn read-analysis-sets [db]
  (mc/find-maps db coll/analysis-sets))

(defn read-analysis-set-by-id [db id]
  (mc/find-map-by-id db coll/analysis-sets id))

(defn read-analysis-set-ids [db]
  (mc/distinct db coll/analysis-sets :_id))

;; ------------------------
;;  Jobs
;; ------------------------

(defn create-job [db job]
  (mc/insert db coll/jobs job))

;; Automatically changes initialized to true, since this is the necessary condition for initialization.
(defn set-job-triples [db job-id triple-ids]
  (mc/update-by-id db coll/jobs job-id {$set {:triples triple-ids, :initialized true}}))

(defn set-job-processed [db job-id n]
  (mc/update-by-id db coll/jobs job-id {$set {:processed n}}))

(defn inc-job-processed [db job-id]
  (mc/update-by-id db coll/jobs job-id {$inc {:processed 1}}))

(defn read-jobs [db]
  (mc/find-maps db coll/jobs))

(defn read-job-by-pair [db scheme-id set-id]
  (mc/find-maps db coll/jobs {:clustalscheme scheme-id :analysisset set-id}))

(defn read-job-by-id [db id]
  (mc/find-map-by-id db coll/jobs id))

(defn read-job-ids [db]
  (mc/distinct db coll/jobs :_id))

;; ------------------------
;;  Triples
;; ------------------------

(defn create-triple [db triple]
  (mc/insert db coll/triples triple))

(defn read-triple-by-id [db id]
  (mc/find-map-by-id db coll/triples id))

;; Like create-triple, but returns the created document,
;; which allows us to retrieve the id
(defn create-triple-ret [db triple]
  (mc/insert-and-return db coll/triples triple))

(defn read-triple-by-unique-key [db k]
  (mc/find-one-as-map db coll/triples {:unique_key k}))

;; ------------------------
;;  Trees
;; ------------------------

(defn create-tree [db tree]
  (mc/insert db coll/trees tree))

(defn read-tree-by-scheme-and-triple [db scheme-id triple-id]
  (mc/find-one-as-map db coll/trees {:clustalscheme scheme-id :triple triple-id}))

;; -------------------------
;; Query
;; -------------------------

;; Trees with :triple in job's :triples
;; and same :clustalscheme as job
;; and have :nonmonophyly true
;;
(defn query-nonmonophyly [db job-id]
  (let [job (read-job-by-id db job-id)]
    (when (some? job)
      (mc/find-maps db coll/trees {:triple {$in (:triples job)}
                                  :clustalscheme (:clustalscheme job)
                                  :nonmonophyly true}))))



;; If you ever want to query for reciprocal non-monophyly,
;; these are the logical conditions the query needs to satisfy:
;;
;; Trees with :triple in job's :triples
;; and same :clustalscheme as job
;; and have :nonmonophyly true
;; and another tree exists with the same :hinge_key,
;; but a different :frame_binomial.
;;
;; The condition of a different :frame_binomial is
;; enough, because the :hinge_key means the binomial
;; must correspond to one of the sequences in the hinge.
;;
;;(defn query-reciprocal-nonmonophyly [db job-id])



