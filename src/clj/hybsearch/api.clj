(ns hybsearch.api
  (:require [clojure.java.io :as io]
            [clojure.string :as cljstr]
            [clojure.set :as cljset]
            [clojure.walk :as walk]
            [hybsearch.db.crud :as crud]
            [hybsearch.db.init :as db])
  (:import  [org.bson.types ObjectId]))


;; ----------
;; Utility
;; ----------

;; Todo: Extend wrap-default so you can provide a vector of valid options to match against
(defn wrap-default [datum dv]
  (if (= datum "") dv datum))


;; ----------
;; Sequences
;; ----------

;; Reads the sequences out of a GenBank file and formats them for entry into the database.
(defn upload-sequences [gb-file]
  ;; Todo: This is probably inefficient in terms of memory.
  ;; See the iota libray (lib for fast mapreduce on text files)
  ;; for a brief expl. of why. Might want to switch to that as
  ;; a later optimization.

  (let [sequences
        (let [filestr (slurp gb-file)]
            (map
              (fn [entry] {:accession (get (re-find #"ACCESSION\s*(\S*)" entry) 1)
                           :binomial (get (re-find #"ORGANISM\s*(.*)" entry) 1)
                           :definition (get (re-find #"DEFINITION([\s\S]*)ACCESSION" entry) 1)
                           :sequence (cljstr/replace
                                       (get (re-find #"ORIGIN\s*\n([\s\S]*)" entry) 1)
                                       #"[\d\s\n\/]"
                                       "")})
              (cljstr/split filestr #"//\n")))]
        (crud/create-sequences @(db/db) sequences)))


;; ----------
;; Construct Set-Def from String
;; ----------

(defn make-set-def [universal set-def-str]
  (if (= universal "true")
    {:_id (ObjectId.) :sequences [] :binomials [] :filter nil :universal true}
    (let [pre-set-def (reduce (fn [sd s]
                            (let [sentinel (first s)
                                  item (re-find #".*" (subs s 1))]
                              (cond
                                (= sentinel \#) (update-in sd [:sequences] conj item)
                                (= sentinel \@) (update-in sd [:binomials] conj item)
                                :else sd)))
                          ;; Starting set-def structure
                          {:_id (ObjectId.)
                           :sequences []
                           :binomials []
                           :filter nil
                           :universal false}
                          ;; Split the lines of the form submission
                          (cljstr/split set-def-str #"\n"))
          ;; Convert accession numbers to the ObjectIds for their
          ;; corresponding sequences. Anything not in the database is dropped.
          ;; Todo: Validate binomials as well. But don't filter +all option.
          set-def (update-in pre-set-def
                             [:sequences]
                             (partial keep ;; Filters out accession values that don't exist in the db
                                      (fn [s]
                                        (:_id (crud/read-sequence-by-accession @(db/db) s)))))]
      set-def)))

;; ----------
;; Analysis Sets
;; ----------

(defn create-analysis-set [n set-def-str]
  ;; Create the set-def, then use its id to create the analysis set
  (let [set-def (make-set-def "false" set-def-str)
        analysis-set {:name n
                      :setdef (:_id set-def)
                      :_id (ObjectId.)}]
    (crud/create-set-def @(db/db) set-def)
    (crud/create-analysis-set @(db/db) analysis-set)))



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
    (crud/create-clustal-scheme @(db/db) scheme)))




;; ----------
;; Jobs
;; ----------

;; Todo: Validate this data to ensure that the scheme and set are
;; in the database before creating the job.
(defn create-job [data]
  (let [pre-set-def (make-set-def
                  (wrap-default (:universal data) "true")
                  (:set-def data))
        ;; Set the set-def's filter to the set-def used by the analysis set
        set-def (assoc-in pre-set-def
                          [:filter]
                          (:setdef (crud/read-analysis-set-by-id
                                     @(db/db)
                                     (ObjectId. (:analysis-set data)))))
        job {
             :_id (ObjectId.)
             :name (:name data)
             :setdef (:_id set-def)
             :clustalscheme (ObjectId. (:clustal-scheme data))
             }]
    ; (println "Data: "        (pr-str data))
    ; (println "pre-set-def: " (pr-str pre-set-def))
    ; (println "set-def: "     (pr-str set-def))
    ; (println "job: "         (pr-str job))
  ;; Create set-def then create job
  (crud/create-set-def @(db/db) set-def)
  (crud/create-job @(db/db) job)))





;; -----------------------------------------------------
;; -----------------------------------------------------


;; cljset/rename-keys to match datascript schema immediately after query,
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
        analysis-sets   (map #(cljset/rename-keys (into {} (filter (comp not nil? val) %))
                                                  {
                                                   :_id :mongodb/objectid
                                                   :name :analysisset/name
                                                   :setdef :analysisset/setdef
                                                   :numtriples :analysisset/numtriples
                                                   :numproc :analysisset/numproc
                                                   })
                             (crud/read-analysis-sets @(db/db)))
        jobs     (map #(cljset/rename-keys (into {} (filter (comp not nil? val) %))
                                           {
                                            :_id :mongodb/objectid
                                            :name :job/name
                                            :setdef :job/setdef
                                            :clustalscheme :job/clustalscheme
                                            :numtriples :job/numtriples
                                            :numproc :job/numproc
                                            })
                      (crud/read-jobs @(db/db)))
        set-defs (map #(cljset/rename-keys (into {} (filter (comp not nil? val) %))
                                           {
                                            :_id :mongodb/objectid
                                            :binomials :setdef/binomials
                                            :sequences :setdef/sequences
                                            :filter :setdef/filter
                                            })
                      (crud/read-set-defs @(db/db)))
        combined (concat clustal-schemes analysis-sets jobs set-defs)
        ; tempids  (reduce into {}
        ;                 (map-indexed
        ;                   (fn [i ent] {(:db/id ent) (- (inc i))})
        ;                      combined))
        ;; Convert ObjectIds to Strings
        entities (walk/prewalk #(if (instance? ObjectId %) (.toString %) ;;(get tempids %)
                                  %) combined)
        ] ;; Todo: Provide an index of tempids to MongoDB ObjectId strings to
          ;;       the client so it can make specific requests for more data.
          ;;       Could probably store in datascript with this schema:
          ;;                     :mongodb/objectid {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
          ;;                     :mongodb/localref {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity :db/valueType :db.type/ref}

          ;; Todo: Purge any inconsistent data. i.e. Analysis set missing its setdef, dead references, etc.
    ; (println "clustal-schemes: " (pr-str clustal-schemes))
    ; (println "analysis-sets: " (pr-str analysis-sets))
    ; (println "jobs: " (pr-str jobs))
    ; (println "set-defs: " (pr-str set-defs))
    ; (println "Combined: " (pr-str combined))
    ;;(println "Temp IDs: " (pr-str tempids))
    ;;(println "Entities: " (pr-str entities))
    entities))

(defn get-jobs-state []
  ;;seed-jobs-data
  {:entities (datascript-jobs-state)})


