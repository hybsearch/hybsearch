(ns hybsearch.db.init
  (:require [monger.core :as mg]
            [monger.collection :as mc]))


;; Note: MongoDB uses MMAPV1 by default so we can use Monger here (since Monger uses the 2.x Java driver)


;; init-db reates things we want if they don't exist.
;; i.e. If not database, create database,
;;      If not collection, create collection (for indexes here, otherwise collections are
;;      implicitly created on document insertion),
;;      If not index, create index,
;;      etc.

(defn init-db []
  (let [conn (mg/connect)
        db (mg/get-db conn "hybsearch")] ;; Will create database "hybsearch" if it does not exist.
    ;; Todo: Does creating an index create a collection?
    (mc/ensure-index db "sequences" (array-map :accession 1) {:unique true})
    db))
