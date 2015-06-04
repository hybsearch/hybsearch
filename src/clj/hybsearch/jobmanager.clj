(ns hybsearch.jobmanager
  (:require [hybsearch.db.crud :as crud]
            [clojure.core.async :as a
             :refer [>! <! >!! <!! go chan buffer close!
                     thread alts! alts!! timeout]]))

;; This function is called when new data is available for clients.
;; Set it by calling reset-updated-fn!.
(defonce updated-fn (atom (fn [] nil)))

(defn reset-updated-fn! [new-fn]
  (reset! updated-fn new-fn))

;; Expects the database object id as a
;; constructed ObjectId object, not as a string
(defn run-job [id] nil)
(defn pause-job [id] nil)