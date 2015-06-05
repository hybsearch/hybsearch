(ns hybsearch.jobmanager
  (:require [monger.collection :as mc]
            [hybsearch.db.init :as db]
            [hybsearch.db.crud :as crud]
            [clojure.math.combinatorics :as combo]
            [clojure.core.async :as a
             :refer [>! <! >!! <!! go chan buffer close!
                     thread alts! alts!! timeout]]))


;; This is one of the few modules where we have to manage state
;; by hand, so be careful!

;; The number of thread workers created for each job
(def ^:const job-threads 4)

;; This function is called when new data is available for clients.
;; Set it by calling reset-updated-fn!.
(defonce updated-fn (atom (fn [] nil)))
(defn reset-updated-fn! [new-fn]
  (reset! updated-fn new-fn))


;; Tracking jobs
;; Job in active-jobs is objectid: {:rate 0
;;                                  :channel chan}
;; You can pause (cancel without undoing work) a job by closing its channel.
;; Once you've taken all the values off a closed channel,
;; subsequent takes will return nil.
;; Workers know to exit when they take nil from a channel.
(defonce active-jobs (atom {}))


;; Caluclates the ids of the triples that still need processing.
(defn triples-left [job-id])


;; Returns true if activated job, false if job already active.
(defn activate-job! [job-id]
  (if (contains? @active-jobs job-id)
    false
    (do
      (swap! active-jobs assoc-in [job-id] {:rate 0 :channel nil})
      true)))

;; Takes a vector of sequence objects as its argument
;; Returns a map of accession vectors keyed by their binomial names
(defn bucket-binomial [seqs]
  (reduce (fn [m s]
            (if (contains? m (:binomial s))
              (update-in m
                         [(:binomial s)]
                         #(conj % (:accession s)))
              (assoc-in m
                        [(:binomial s)]
                        [(:accession s)])))
          {} seqs))


;; TODO: This can be optimized to avoid redundant work by writing a
;;       unique-pairs function that can replace the (remove ... (cartesian-product ...)) composition.

;; Takes sequences a and b
;; returns all triples that can be created where
;; at least one element is from a and at least one
;; element is from b
(defn triples [a b]
  (let [unique-a (remove #(= (nth % 0) (nth % 1)) (combo/cartesian-product a a))
        unique-b (remove #(= (nth % 0) (nth % 1)) (combo/cartesian-product b b))]
    (concat (map #(flatten %) (combo/cartesian-product unique-a b))
            (map #(flatten %) (combo/cartesian-product unique-b a)))))

;; Takes a map of vectors keyed by binomial names
;; Returns all triples (as map sequences: [accession, accession, accession]) that can be formed between pairs of binomial vectors
(defn binom-triples [m]
  (let [binoms (keys m)
        binom-pairs (remove #(= (nth % 0) (nth % 1)) ;; remove pairs like [binom_A, binom_A], since we don't want to compare those
                          (combo/cartesian-product binoms binoms))]
    (apply concat (map (fn [pair] (triples (get m (nth pair 0)) (get m (nth pair 1))))
                  binom-pairs))))

;; Initializes the job (creates triples) if it is not yet initialized.
;;         1) Checks if the job is not yet initialized, if not, creates the triples and sets initialized to true.
;; Returns true if just initialized, false if already initialized.
(defn init-job! [job]
  (if (:initialized job)
    false
    (do
      (println "Triples-test: (triples [1 2 3] [4 5]): " (triples [1 2 3] [4 5]))
      (println "Triples: " (->>
                              (:analysisset job)
                              (crud/read-analysis-set-by-id @(db/db))
                              (:sequences)
                              (crud/read-sequences-by-accessions @(db/db))
                              (bucket-binomial)
                              (binom-triples)));; Compute the triples for the job (sequences in binomial buckets, triples from bucket pairs)
      ;; Write the triples to the database
      true)))

;; Creates the channel, stores it with
;; the job in active-jobs, and launches the threads for
;; processing the triples.
(defn process-triples! [job-id triples] true)

;; Expects the database object id as a
;; constructed ObjectId object, not as a string
(defn run-job! [job-id]
  (let [job (crud/read-job-by-id @(db/db) job-id)]
    (println "job: " job)
    (if job ;; If the job doesn't exist in the database, no point in continuing.
      (if (activate-job! job-id) ;; If the job is already active (false return val), this run-job! call is redundant.
        (if (init-job! job)   ;; If the job was just initialized (true return val), we know that every triple still needs processing.
          nil)))))





;; will have to swap dissoc on active-jobs
;; and kill any threads in the job
(defn pause-job! [job-id] nil)


;; Todo: Handle run-job on an already-running job
;;       Handle pause-job on an already-paused job