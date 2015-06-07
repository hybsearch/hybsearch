(ns hybsearch.api
  (:require [clojure.java.io :as io]
            [clojure.string :as cljstr]
            [clojure.set :as cljset]
            [clojure.walk :as walk]
            [hybsearch.db.crud :as crud]
            [hybsearch.db.init :as db]
            [hybsearch.jobmanager :as jm]
            [clojure.math.combinatorics :as combo])
  (:import  [org.bson.types ObjectId]))


;; This function is called when new data is available for clients.
;; Set it by calling reset-updated-fn!.
(defonce updated-fn (atom (fn [] nil)))

(defn reset-updated-fn! [new-fn]
  (reset! updated-fn new-fn)
  (jm/reset-updated-fn! new-fn))

;; ----------
;; Utility
;; ----------

(defn wrap-default [datum dv]
  (if (= datum "") dv datum))

;; ----------
;; Sequences
;; ----------

;; Reads the sequences out of a GenBank file and formats them for entry into the database.
;; Returns a vector of accession numbers for the sequences on success.
(defn upload-sequences [gb-file]
  ;; Todo: This is probably inefficient in terms of memory.
  ;; See the iota libray (lib for fast mapreduce on text files)
  ;; for a brief expl. of why. Might want to switch to that as
  ;; a later optimization.
  (let [sequences
        ;; Note: We remove sequences where any field is nil (sometimes non-entry data is parsed,
        ;; i.e. an extra newline at the end of the file)
        ;; TODO: when bad data is filtered out, it should be logged somewhere or reported to the user.
        (remove #(some nil? (vals %))
                (let [filestr (slurp gb-file)]
                  (map
                    (fn [entry] {:accession (get (re-find #"ACCESSION\s*(\S*)" entry) 1)
                                 :binomial (get (re-find #"ORGANISM\s*(.*)" entry) 1)
                                 :definition (get (re-find #"DEFINITION([\s\S]*)ACCESSION" entry) 1)
                                 :sequence (try
                                             (cljstr/replace
                                               (get (re-find #"ORIGIN\s*\n([\s\S]*)" entry) 1)
                                               #"[\d\s\n\/]"
                                               "")
                                             (catch Exception e nil))})
                    (cljstr/split filestr #"//\n"))))]
        ;; Try to insert the sequences in the database, ignoring duplicates.
        ;; Return a vector of the accession numbers of the sequences.
        (mapv (fn [s]
                (try
                  (:accession (crud/create-sequence-ret @(db/db) s))
                  (catch com.mongodb.DuplicateKeyException e (:accession s))))
              sequences)))



;; ----------
;; Jobs
;; ----------

(defn run-job [id] (when (some? id) (jm/run-job! (ObjectId. id))))
(defn pause-job [id] (when (some? id) (jm/pause-job! (ObjectId. id))))

; Todo: Validate this data to ensure that the scheme and set are
; in the database before creating the job.
(defn create-job [scheme-id set-id]
  (let [job {:_id (ObjectId.)
             :clustalscheme scheme-id
             :analysisset set-id
             :triples []
             :processed 0
             :errors []
             :initialized false}]
  (crud/create-job @(db/db) job)))

(defn job-pair-exists? [scheme-id set-id]
  (> (count (crud/read-job-by-pair @(db/db) scheme-id set-id)) 0))

;; Returns a vector [[scheme-id set-id] ...] of pairs for which no jobs exist
(defn missing-job-pairs []
  (let [scheme-ids (crud/read-clustal-scheme-ids @(db/db))
        set-ids (crud/read-analysis-set-ids @(db/db))
        jobs (crud/read-jobs @(db/db))]
    (remove #(apply job-pair-exists? %)
            (combo/cartesian-product scheme-ids set-ids))))


;; Makes sure a job exists for every clustal scheme/analysis set combination
(defn ensure-jobs []
  (let [missing (missing-job-pairs)]
    (doseq [pair missing] (apply create-job pair))))

;; ----------
;; Analysis Sets
;; ----------

(defn create-analysis-set [set-name gb-file]
  (let [accessions (upload-sequences gb-file)
        analysis-set {:name set-name
                      :sequences accessions
                      :_id (ObjectId.)}]
    (crud/create-analysis-set @(db/db) analysis-set)
    (ensure-jobs)
    (@updated-fn)))


;; ----------
;; Clustal Schemes
;; ----------

(defn create-clustal-scheme [data]
  (let [scheme {
                :_id (ObjectId.)
                :name (:name data)
                :sequencetype   (wrap-default (:sequencetype  data)  "DNA")
                :alignmenttype  (wrap-default (:alignmenttype data)  "slow")
                :pwdnamatrix    (wrap-default (:pwdnamatrix   data)  "iub")
                :pwgapopen      (wrap-default (:pwgapopen     data)  "10")
                :pwgapext       (wrap-default (:pwgapext      data)  "0.10")
                :ktuple         (wrap-default (:ktuple        data)  "1")
                :window         (wrap-default (:window        data)  "5")
                :topdiags       (wrap-default (:topdiags      data)  "5")
                :pairgap        (wrap-default (:pairgap       data)  "3")
                :dnamatrix      (wrap-default (:dnamatrix     data)  "iub")
                :gapopen        (wrap-default (:gapopen       data)  "10")
                :gapext         (wrap-default (:gapext        data)  "0.20")
                :gapdist        (wrap-default (:gapdist       data)  "5")
                :endgaps        (wrap-default (:endgaps       data)  "false") ;; true/false
                :iteration      (wrap-default (:iteration     data)  "none")
                :numiter        (wrap-default (:numiter       data)  "1")
                :clustering     (wrap-default (:clustering    data)  "NJ")
                :kimura         (wrap-default (:kimura        data)  "false") ;; true/false
                }]
    (if (= (:name scheme) "") (throw (Exception. "You must provide a name for your clustal scheme.")))
    (crud/create-clustal-scheme @(db/db) scheme)
    (ensure-jobs)
    (@updated-fn)))


;; -----------------------------------------------------
;; State construction:
;; -----------------------------------------------------

;; Utility to average the time vector
;; Divides average time per triple by the number
;; of workers per job, to estimate advantage of
;; parallelism.
(defn avgtime [v]
  (if (or (nil? v) (= 0 (count v)))
    0
    (/ (apply + v) (count v) jm/num-job-workers)))

;; Rename keys to match datascript schema immediately after query,
;; to avoid inter-collection name collisions that could occur once combined.
;; Also filter out nil entries, since these aren't allowed in datascript.
(defn datascript-jobs-state []
  (let [clustal-schemes (map #(cljset/rename-keys (into {} (filter (comp not nil? val) %))
                                                  {
                                                   :_id :mongodb/objectid
                                                   :name :clustalscheme/name
                                                   :sequencetype :clustalscheme/sequencetype
                                                   :alignmenttype :clustalscheme/alignmenttype
                                                   :pwdnamatrix :clustalscheme/pwdnamatrix
                                                   :pwgapopen :clustalscheme/pwgapopen
                                                   :pwgapext :clustalscheme/pwgapext
                                                   :ktuple :clustalscheme/ktuple
                                                   :window :clustalscheme/window
                                                   :topdiags :clustalscheme/topdiags
                                                   :pairgap :clustalscheme/pairgap
                                                   :dnamatrix :clustalscheme/dnamatrix
                                                   :gapopen :clustalscheme/gapopen
                                                   :gapext :clustalscheme/gapext
                                                   :gapdist :clustalscheme/gapdist
                                                   :endgaps :clustalscheme/endgaps
                                                   :iteration :clustalscheme/iteration
                                                   :numiter :clustalscheme/numiter
                                                   :clustering :clustalscheme/clustering
                                                   :kimura :clustalscheme/kimura
                                                   })
                             (crud/read-clustal-schemes @(db/db)))
        analysis-sets   (map #(cljset/rename-keys (-> (into {} (filter (comp not nil? val) %))
                                                      (update-in [:sequences] count))
                                                  {
                                                   :_id :mongodb/objectid
                                                   :name :analysisset/name
                                                   :sequences :analysisset/sequences
                                                   })
                             (crud/read-analysis-sets @(db/db)))
        jobs     (map #(cljset/rename-keys (-> (into {} (filter (comp not nil? val) %))
                                             (update-in [:triples] count)
                                             (assoc-in [:avgtime] (avgtime (get @jm/timings (:_id %))))
                                             (assoc-in [:status] (if (:initialized %) ;; Todo: Status should be "Complete." when finished
                                                                   (if (contains? @jm/active-jobs (:_id %))
                                                                     "Running."
                                                                     "Paused.")
                                                                   "Not yet initialized.")))
                                           {
                                            :_id :mongodb/objectid
                                            :clustalscheme :job/clustalscheme
                                            :analysisset :job/analysisset
                                            :status :job/status
                                            :errors :job/errors
                                            :initialized :job/initialized
                                            :triples :job/triples
                                            :processed :job/processed
                                            :avgtime :job/avgtime
                                            })
                      (crud/read-jobs @(db/db)))
        combined (concat clustal-schemes analysis-sets jobs)
        ;; Convert ObjectIds to Strings
        entities (walk/prewalk #(if (instance? ObjectId %) (.toString %)
                                  %) combined)
        ]
    ; (println "clustal-schemes: " (pr-str clustal-schemes))
    ; (println "analysis-sets: " (pr-str analysis-sets))
    ; (println "jobs: " (pr-str jobs))
    ; (println "Combined: " (pr-str combined))
    ; (println "Entities: " (pr-str entities))
    entities))

(defn get-jobs-state []
  {:entities (datascript-jobs-state)})

(defn get-analysis-set-sequences []
  (let [sets (crud/read-analysis-sets @(db/db))
        full-seqs (map (fn [s] (-> s
                                   (update-in [:_id] #(.toString %))
                                   (update-in [:sequences] #(map (fn [seqn] (assoc-in seqn [:_id] (.toString (:_id seqn))))
                                                              (crud/read-sequences-by-accessions @(db/db) %)))))
                      sets)
        by-id (reduce (fn [m s] (assoc-in m [(:_id s)] (:sequences s)))
                          {} full-seqs)
        ]
    by-id))

;; ------------------
;; Query
;; ------------------

;; Reduces the crud result into a map of tree sequences by binomial pair keys
(defn query-nonmonophyly [job-id]
  (reduce (fn [m t]
            (if (some? (get m (:pair_key t)))
              (update-in m [(:pair_key t)] conj (:tree t))
              (assoc-in m [(:pair_key t)] [])))
          {}
          (crud/query-nonmonophyly @(db/db) (ObjectId. job-id))))


