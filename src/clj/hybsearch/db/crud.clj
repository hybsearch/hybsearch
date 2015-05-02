(ns db.crud
  (:require [monger.core :as mg]
            [monger.collection :as mc]
            [db.collection-names :as coll]
            [validateur.validation :as v])
  (:import org.bson.types.ObjectId))


;; Note: MongoDB uses MMAPV1 by default so we can use Monger here (since Monger uses the 2.x Java driver)


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
(defn create-sequences [db sequences]
  (mc/insert-batch db coll/sequences sequences)) ;; Insert

(defn sequence-by-accession [db accession])


;; ------------------------
;;  Clustal Schemes
;; ------------------------

(defn create-clustal-scheme [db scheme])

;; ------------------------
;;  Set Defs
;; ------------------------

(defn create-set-def [db set-def])

;; ------------------------
;;  Analysis Sets
;; ------------------------

(defn create-analysis-set [db analysis-set])

;; ------------------------
;;  Jobs
;; ------------------------

(defn create-job [db job])

;; ------------------------
;;  Triples
;; ------------------------

(defn create-triple [db triple])

;; ------------------------
;;  Trees
;; ------------------------

(defn create-tree [db tree])

