(ns hybsearch.db.init
  (:require [monger.core :as mg]
            [monger.collection :as mc]
            [hybsearch.db.collections :as coll]))

;; Shared DB access point

(defonce _db (atom nil))

;; init-db creates things we want if they don't exist.
;; i.e. If not database, create database,
;;      If not collection, create collection (for indexes here, otherwise collections are
;;      implicitly created on document insertion),
;;      If not index, create index,
;;      etc.

(defn init-db []
  (let [conn (mg/connect)
        db (mg/get-db conn "hybsearch")] ;; Will create database "hybsearch" if it does not exist.
    ;; Todo: Does creating an index create a collection?
    (mc/ensure-index db coll/sequences (array-map :accession 1) {:unique true})
    (mc/ensure-index db coll/jobs (array-map :clustalscheme 1 :analysisset 1) {:unique true})
    (mc/ensure-index db coll/triples (array-map :unique_key 1) {:unique true})
    (mc/ensure-index db coll/trees (array-map :clustalscheme 1 :triple 1) {:unique true})
    db))

;; TODO: Might be a good idea to throw an error if ensure-db fails.
;; Otherwise an error will probably occur when you try to perform
;; a db operation without an initialized database.
(defn ensure-db []
  (if (nil? @_db) (reset! _db (init-db))))

;; Use this to get the db atom so it's always initialized
(defn db [] (ensure-db) _db)
