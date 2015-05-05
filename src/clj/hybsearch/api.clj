(ns hybsearch.api
  (:require [clojure.java.io :as io]
            [clojure.string :as cljstr]
            [clojure.set :as cljset]
            [clojure.walk :as walk]
            [hybsearch.db.crud :as crud]
            [hybsearch.db.init :as db-init])
  (:import  [org.bson.types ObjectId]))


;; -----------------------------------------------------
;;  RPC for mutating the database
;; -----------------------------------------------------

(defonce _db (atom nil))

(defn ensure-db []
  (if (nil? @_db) (reset! _db (db-init/init-db))))

(defn db [] (ensure-db) _db) ;; ensure-db and return _db, use this to get the db atom so it's always initialized

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
        (crud/create-sequences @(db) sequences)))


;; ----------
;; Construct Set-Def from String
;; ----------

(defn make-set-def [set-def-str]
  (let [pre-set-def (reduce (fn [sd s]
                          (let [sentinel (first s)
                                item (re-find #".*" (subs s 1))]
                            (cond
                              (= sentinel \#) (update-in sd [:sequences] conj item)
                              (= sentinel \@) (update-in sd [:binomials] conj item)
                              :else sd)))
                        ;; Starting set-def structure
                        {:sequences []
                         :binomials []
                         :filter nil
                         :_id (ObjectId.)}
                        ;; Split the lines of the form submission
                        (cljstr/split set-def-str #"\n"))
        ;; Convert accession numbers to the ObjectIds for their
        ;; corresponding sequences. Anything not in the database is dropped.
        ;; Todo: Validate binomials as well. But don't filter +all option.
        set-def (update-in pre-set-def
                           [:sequences]
                           (partial keep ;; Filters out accession values that don't exist in the db
                                    (fn [s]
                                      (:_id (crud/read-sequence-by-accession @(db) s)))))]
    set-def))

;; ----------
;; Analysis Sets
;; ----------

(defn create-analysis-set [n set-def-str]
  ;; Create the set-def, then use its id to create the analysis set
  (let [set-def (make-set-def set-def-str)
        analysis-set {:name n
                      :setdef (:_id set-def)
                      :_id (ObjectId.)}]
    (crud/create-set-def @(db) set-def)
    (crud/create-analysis-set @(db) analysis-set)))



;; ----------
;; Clustal Schemes
;; ----------

(defn wrap-default [datum dv]
  (if (= datum "") dv datum))

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
    (crud/create-clustal-scheme @(db) scheme)))


;; -----------------------------------------------------
;; -----------------------------------------------------

(def seed-sequence-data [
                {:db/id -20
                 :sequence/accession     "HM233091"
                 :sequence/binomial      "Lepus mandshuricus"}
                {:db/id -21
                 :sequence/accession     "AB687524"
                 :sequence/binomial      "Lepus timidus"}
                {:db/id -22
                 :sequence/accession     "AB687525"
                 :sequence/binomial      "Lepus timidus"}])


(def seed-jobs-data [
                {:db/id -1
                 :clustalscheme/name       "Scheme 1"
                 :clustalscheme/exsetting "Example Option 1"
                 :clustalscheme/numtriples 900
                 :clustalscheme/numproc 23
                 } ;; Todo: Maybe even allow people to view and manage their clustal schemes separately from analysis sets

                {:db/id -80
                 :clustalscheme/name       "Scheme 2"
                 :clustalscheme/exsetting "Example Option 2"
                 :clustalscheme/numtriples 900
                 :clustalscheme/numproc 67
                 }

                ;; This will act as the set def for one of our example analysis sets
                {:db/id -90
                 :setdef/sequences ["HM233091", "AB687524", "AB687525"]}

                ;; This will be the set def for our example jobs
                {:db/id -1000
                 :setdef/binomials ["Lepus timidus", "Lepus mandshuricus"]
                 :setdef/filter -90}

                {:db/id -100
                 :setdef/sequences []}


                {:db/id -2
                 :job/name "Lepus 1"
                 :job/clustalscheme -1
                 :job/setdef -1000
                 :job/numtriples 1
                 :job/numproc 1}

                {:db/id -3
                 :job/name "Lepus 2"
                 :job/clustalscheme -1
                 :job/setdef -1000
                 :job/numtriples 1
                 :job/numproc 1}

                {:db/id -5
                 :analysisset/name "Set 1"
                 :analysisset/setdef -90
                 :analysisset/numtriples 1
                 :analysisset/numproc 1}

                {:db/id -4
                 :analysisset/name "Empty Set"
                 :analysisset/setdef -100
                 :analysisset/numtriples 0
                 :analysisset/numproc 0}

                ])


;; cljset/rename-keys to match datascript schema immediately after query,
;; to avoid inter-collection name collisions that could occur once combined.
;; Also filter out nil entries, since these aren't allowed in datascript.
(defn datascript-jobs-state []
  (let [clustal-schemes (map #(cljset/rename-keys (into {} (filter (comp not nil? val) %))
                                                  {
                                                   :_id :mongodb/id
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
                             (crud/read-clustal-schemes @(db)))
        analysis-sets   (map #(cljset/rename-keys (into {} (filter (comp not nil? val) %))
                                                  {
                                                   :_id :mongodb/id
                                                   :name :analysisset/name
                                                   :setdef :analysisset/setdef
                                                   :numtriples :analysisset/numtriples
                                                   :numproc :analysisset/numproc
                                                   })
                             (crud/read-analysis-sets @(db)))
        jobs     (map #(cljset/rename-keys (into {} (filter (comp not nil? val) %))
                                           {
                                            :_id :mongodb/id
                                            :setdef :job/setdef
                                            :clustalscheme :job/clustalscheme
                                            :numtriples :job/numtriples
                                            :numproc :job/numproc
                                            })
                      (crud/read-jobs @(db)))
        set-defs (map #(cljset/rename-keys (into {} (filter (comp not nil? val) %))
                                           {
                                            :_id :mongodb/id
                                            :binomials :setdef/binomials
                                            :sequences :setdef/sequences
                                            :filter :setdef/filter
                                            })
                      (crud/read-set-defs @(db)))
        combined (concat clustal-schemes analysis-sets jobs set-defs)
        ; tempids  (reduce into {}
        ;                 (map-indexed
        ;                   (fn [i ent] {(:db/id ent) (- (inc i))})
        ;                      combined))
        ;; Now replace the ObjectIDs, including the ones on :db/id, with their tempids
        ;; for the client-side datascript transaction.
        entities (walk/prewalk #(if (instance? ObjectId %) (.toString %) ;;(get tempids %)
                                  %) combined)
        ] ;; Todo: Provide an index of tempids to MongoDB ObjectId strings to
          ;;       the client so it can make specific requests for more data.
          ;;       Could probably store in datascript with this schema:
          ;;                     :mongodb/id {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
          ;;                     :mongodb/localref {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity :db/valueType :db.type/ref}

          ;; Todo: Purge any inconsistent data. i.e. Analysis set missing its setdef, dead references, etc.
    (println "clustal-schemes: " (pr-str clustal-schemes))
    (println "analysis-sets: " (pr-str analysis-sets))
    (println "jobs: " (pr-str jobs))
    (println "set-defs: " (pr-str set-defs))
    (println "Combined: " (pr-str combined))
    ;;(println "Temp IDs: " (pr-str tempids))
    (println "Entities: " (pr-str entities))
    entities))

(defn get-jobs-state []
  ;;seed-jobs-data
  {:entities (datascript-jobs-state)})


