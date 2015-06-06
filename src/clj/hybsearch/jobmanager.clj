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
;;                                  :future fut}
;; You can pause (cancel without undoing work) a job by calling future-cancel on its future.
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


(defn process-triples! [job-id triples]
  (swap! active-jobs assoc-in [job-id :future]
         (future
           (let [t-chan (chan)]
             (dotimes [_ num-job-workers]
               (thread ;; These threads will die with the parent thread if the future is canceled.
                 (while (let [t (<!! t-chan)]
                          (if (some? t)
                            (do
                              (>!! output-chan (str "Job: " job-id " Triple: " t))
                              (crud/inc-job-processed @(db/db) job-id)
                              (@updated-fn)
                              (Thread/sleep 500)))
                          t)) ;; Note returned t here, while loop exits when t is nil (channel closed condition)
                 (>!! output-chan (str "Consumer exiting."))))
             (loop [ts triples]
               (if (and (seq ts) (not (Thread/interrupted)))
                 (do
                   (>!! t-chan (first ts))
                   (recur (rest ts)))))
             ;; When finished, close the channel and remove the job from active-jobs
             (>!! output-chan (str "Job: " job-id " finished."))
             (close! t-chan)
             (swap! active-jobs dissoc job-id)))))


;; Expects the database object id as a
;; constructed ObjectId object, not as a string
(defn run-job! [job-id]
  (let [job (crud/read-job-by-id @(db/db) job-id)]
    (if (some? job) ;; If the job doesn't exist in the database, no point in continuing.
      (if (activate-job! job-id) ;; If the job is already active (false return val), this run-job! call is redundant, and exits.
        (do
          (init-job job)
          (process-triples! job-id (triples-left job-id)))))))

;; Attempts to pause the job by calling future-cancel on the job's future
;; Then removes the job from active-jobs
;; Technically this could remove the job from active-jobs while it's future
;; were still running, but in testing it reliably cancels. I think that the
;; future manages to deal with the interrupt when it's waiting on the channel,
;; because the channel operations block, and InterruptedException is often
;; thrown by blocking operations. That's just a theory though.
(defn pause-job! [job-id]
  (let [f (get-in @active-jobs [job-id :future])]
    (if (future? f)
      (do
        (future-cancel f)
        (swap! active-jobs dissoc job-id)))))