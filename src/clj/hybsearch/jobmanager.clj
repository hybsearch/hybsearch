(ns hybsearch.jobmanager
  (:require
            [hybsearch.db.init :as db]
            [hybsearch.db.crud :as crud]
            [clojure.string :as cljstr]
            [clojure.math.combinatorics :as combo]
            [clojure.core.async :as a
             :refer [>! <! >!! <!! go chan buffer close!
                     thread alts! alts!! timeout]])
  (:import [java.lang Thread]))


;; This is one of the few modules where we have to manage state
;; by hand, so be careful!

;; The number of thread workers created for each job
(def ^:const num-job-workers 4)

;; This function is called when new data is available for clients.
;; Set it by calling reset-updated-fn!.
(defonce updated-fn (atom (fn [] nil)))
(defn reset-updated-fn! [new-fn]
  (reset! updated-fn new-fn))

(defonce output-chan (chan))
(thread
  (while true
    (let [msg (<!! output-chan)]
      (println msg))))

;; Tracking jobs
;; Job in active-jobs is objectid: {:rate 0
;;                                  :channel chan}
;; You can pause (cancel without undoing work) a job by closing its channel.
;; Once you've taken all the values off a closed channel,
;; subsequent takes will return nil.
;; Workers know to exit when they take nil from a channel.
(defonce active-jobs (atom {}))


;; Caluclates the ids of the triples that still need processing.
(defn triples-left [job-id]
  (let [job (crud/read-job-by-id @(db/db) job-id)]
    (if (= 0 (:processed job))
      ;; If nothing's processed, return everything.
      (:triples job)
      ;; Otherwise calculate which triples still need to be processed. ;; TODO: This would be a good place to double-check that "processed" is correct, in case it missed an update during a crash.
      (remove nil? (map #(if (some? (crud/read-tree-by-scheme-and-triple @(db/db) (:clustalscheme job) %)) ;; If this triple has a tree, it doesn't need to be processed.
                           nil %)
                        (:triples job))))))


;; Returns true if activated job, false if job already active.
(defn activate-job! [job-id]
  (if (contains? @active-jobs job-id)
    false
    (do
      (swap! active-jobs assoc-in [job-id] {:rate 0 :future nil})
      (@updated-fn)
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



;; Takes sequences a and b
;; returns all triples that can be created where
;; at least one element is from a and at least one
;; element is from b
(defn triples [a b]
  (let [a-pairs (combo/combinations a 2)
        b-pairs (combo/combinations b 2)]
    (concat (map #(flatten %) (combo/cartesian-product a-pairs b))
            (map #(flatten %) (combo/cartesian-product b-pairs a)))))

;; Takes a map of vectors keyed by binomial names
;; Returns all triples (as map sequences: [accession, accession, accession]) that can be formed between pairs of binomial vectors
(defn binom-triples [m]
  (let [binoms (keys m)
        binom-pairs (combo/combinations binoms 2)]
    (apply concat (map (fn [pair] (triples (get m (nth pair 0)) (get m (nth pair 1))))
                  binom-pairs))))



;; Tries to construct and insert every triple in ts in the database
;; If an insertion violates triple uniqueness, finds the triple id for that triple instead of inserting
;; Returns a sequence of ObjectIds corresponding to the triples in ts
(defn write-triples [ts]
  (mapv (fn [t]
         (try
           (:_id (crud/create-triple-ret @(db/db) {:sequences t
                                                   :unique_key (cljstr/join "," (sort t))}))
           (catch com.mongodb.DuplicateKeyException e
             (:_id (crud/read-triple-by-unique-key @(db/db) (cljstr/join "," (sort t)))))))
       ts))

;; Initializes the job (creates triples) if it is not yet initialized.
;;         1) Checks if the job is not yet initialized, if not, creates the triples and sets initialized to true.
;; Returns true if just initialized, false if already initialized.
(defn init-job [job]
  (if (:initialized job)
    false
    (let [trip-ids (write-triples
                     (->>
                       (:analysisset job)
                       (crud/read-analysis-set-by-id @(db/db))
                       (:sequences)
                       (crud/read-sequences-by-accessions @(db/db))
                       (bucket-binomial)
                       (binom-triples)))]
      ;; Assign list of ids to the job's triples array in the database
      ;; Setting the triples automatically changes initialized to true.
      (crud/set-job-triples @(db/db) (:_id job) trip-ids)
      (@updated-fn)
      true)))

;; Creates the channel, stores it with
;; the job in active-jobs, and launches the threads for
;; processing the triples.
; (defn process-triples! [job-id triples]
;   (println "Triples to process count:" (count triples))
;   ;; create channel and save in active-jobs atom
;   (swap! active-jobs assoc-in [job-id :channel] (chan)) ;; Todo: Need to test whether or not this messes up active channels (to test, just try pausing a job and see if it actually stops when the channel is closed).
;   ;; launch workers
;   (let [t-channel (get-in @active-jobs [job-id :channel])]
;     (dotimes [_ num-job-workers]
;       (thread
;         (while true
;           (let [t (<!! t-channel)]
;             (>!! output-chan (str "Job: " job-id " Triple: " t))
;             (Thread/sleep 1000)))))
;     ;; toss triples on the channel 'til we're done
;     (thread
;       (doseq [t triples]
;         (if (nil? (>!! t-channel t)) ;; returns nil once channel is closed and all has been consumed
;           (throw (Exception. "Killing thread."))))))) ;; Todo: Is throwing an exception the only way to kill the thread?


(defn process-triples! [job-id triples]
  (swap! active-jobs assoc-in [job-id :future]
         (future
           (let [t-chan (chan)]
             (dotimes [_ num-job-workers]
               (thread
                 (while (let [t (<!! t-chan)]
                          (if (some? t)
                            (>!! output-chan (str "Job: " job-id " Triple: " t)))
                          (Thread/sleep 500)
                          t)))) ;; Note returned t here, while loop exits when t is nil (channel closed condition)
             (loop [ts triples]
               (if (and (seq ts) (not (Thread/interrupted)))
                 (do
                   (>!! t-chan (first ts))
                   (recur (rest ts)))))
             (close! t-chan)))))



;; Expects the database object id as a
;; constructed ObjectId object, not as a string
(defn run-job! [job-id]
  (let [job (crud/read-job-by-id @(db/db) job-id)]
    (if (some? job) ;; If the job doesn't exist in the database, no point in continuing.
      (if (activate-job! job-id) ;; If the job is already active (false return val), this run-job! call is redundant.
        (do
          (init-job job)
          (process-triples! job-id (triples-left job-id)))))))





;; will have to swap dissoc on active-jobs
;; and kill any threads in the job
(defn pause-job! [job-id] nil)


;; Todo: Handle run-job on an already-running job
;;       Handle pause-job on an already-paused job