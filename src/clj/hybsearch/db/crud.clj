(ns hybsearch.db.crud
  (:require [monger.core :as mg]
            [monger.collection :as mc]
            [monger.operators :refer :all]
            [hybsearch.db.collections :as coll])
  (:import org.bson.types.ObjectId))


;; Note: MongoDB uses MMAPV1 by default so we can use Monger here (Can't use WiredTiger since Monger uses the 2.x Java driver)


; (let [conn (mg/connect) ;; localhost, default port (27017)
;       db   (mg/get-db conn "test")
;       coll "restaurants"]
;   (println "Query: " (mc/find-maps db coll {"address.building" "1007"}))
;   (println "Number of addresses: " (mc/count db coll))

;   )


;; As a note, it is recommended to always store new documents with the :_id key set,
;; since the Monger driver will have to mutate the document, which given
;; Clojure's immutable data structures might result in behavior the MongoDB authors
;; did not anticipate.



;; IMPORTANT TODO:
;; Todo: Add Validateur for data validation on create methods
;; Implement validations as separate methods for each document type (not internal to any crud methods)


;; Note: All of these methods take Clojure data structures as arguments.





;; ------------------------
;;  Sequences
;; ------------------------

;; Sequences are unique by accession number and immutable once created.
;; We do not yet allow deletion (this has to sync to deletions
;; on a lot of associated collections).

;; This is a batch-write of sequence objects.
;; The sequences should be an array of Clojure maps,
;; they will be converted to DB Objects inside this
;; method.

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

(defn read-clustal-schemes [db]
  (mc/find-maps db coll/clustal-schemes))

(defn read-clustal-scheme-ids [db]
  (mc/distinct db coll/clustal-schemes :_id))


;; ------------------------
;;  Analysis Sets
;; ------------------------

;; API Todo: Remember set-def, handle the creation of it outside of CRUD
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

;; API Todo: Need to create the set-def separately, and put ref to proper analysis set's set-def in the job map.
(defn create-job [db job]
  (mc/insert db coll/jobs job))

;; Automatically changes initialized to true, since this is the necessary condition for initialization.
(defn set-job-triples [db job-id triple-ids]
  (mc/update-by-id db coll/jobs job-id {$set {:triples triple-ids, :initialized true}}))

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



