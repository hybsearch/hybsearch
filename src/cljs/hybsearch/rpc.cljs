(ns hybsearch.rpc
  (:require-macros
    [tailrecursion.javelin :refer [defc defc= set-cell!=]]
    [cljs.core.async.macros :as asyncm :refer (go go-loop)])
  (:require
   [tailrecursion.javelin :refer [cell-map]]
   [datascript :as d]
   [cljs.core.async :as async :refer (<! >! put! chan)]
   [taoensso.sente :as sente :refer (cb-success?)]))

(enable-console-print!)

(defonce jobs-db-schema {
             :mongodb/objectid                    {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
             ;;:mongodb/localref                   {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity :db/valueType :db.type/ref}

             :clustalscheme/name                  {:db/cardinality :db.cardinality/one}
             :clustalscheme/sequencetype          {:db/cardinality :db.cardinality/one}
             :clustalscheme/alignmenttype         {:db/cardinality :db.cardinality/one}
             :clustalscheme/pwdnamatrix           {:db/cardinality :db.cardinality/one}
             :clustalscheme/pwgapopen             {:db/cardinality :db.cardinality/one}
             :clustalscheme/pwgapext              {:db/cardinality :db.cardinality/one}
             :clustalscheme/ktuple                {:db/cardinality :db.cardinality/one}
             :clustalscheme/window                {:db/cardinality :db.cardinality/one}
             :clustalscheme/topdiags              {:db/cardinality :db.cardinality/one}
             :clustalscheme/pairgap               {:db/cardinality :db.cardinality/one}
             :clustalscheme/dnamatrix             {:db/cardinality :db.cardinality/one}
             :clustalscheme/gapopen               {:db/cardinality :db.cardinality/one}
             :clustalscheme/gapext                {:db/cardinality :db.cardinality/one}
             :clustalscheme/gapdist               {:db/cardinality :db.cardinality/one}
             :clustalscheme/endgaps               {:db/cardinality :db.cardinality/one}
             :clustalscheme/iteration             {:db/cardinality :db.cardinality/one}
             :clustalscheme/numiter               {:db/cardinality :db.cardinality/one}
             :clustalscheme/clustering            {:db/cardinality :db.cardinality/one}
             :clustalscheme/kimura                {:db/cardinality :db.cardinality/one}
             :clustalscheme/numtriples            {:db/cardinality :db.cardinality/one} ;; Always the same, equal to the number of triples that can be created for all sequences
             :clustalscheme/numproc               {:db/cardinality :db.cardinality/one} ;; Depends on how well processed the global set is for this clustal scheme

             :analysisset/name                    {:db/cardinality :db.cardinality/one}
             :analysisset/setdef                  {:db/cardinality :db.cardinality/one}
             :analysisset/numtriples              {:db/cardinality :db.cardinality/one}
             :analysisset/numproc                 {:db/cardinality :db.cardinality/one}


             :job/name                            {:db/cardinality :db.cardinality/one}
             :job/setdef                          {:db/cardinality :db.cardinality/one}
             :job/numtriples                      {:db/cardinality :db.cardinality/one}
             :job/numproc                         {:db/cardinality :db.cardinality/one}
             :job/clustalscheme                   {:db/cardinality :db.cardinality/one}


             ;; Todo: how to match up relational ref ids when downloading data from server?

             ;; all triples for the set = triples(sequences for each binomial UNION sequences list) INTERSECT analysisset triples
             :setdef/binomials                    {:db/cardinality :db.cardinality/many} ;; Currently a list of binomial species names
             :setdef/sequences                    {:db/cardinality :db.cardinality/many} ;; Currently a list of accession numbers
             ;; Filter is optional. Filter further restricts the set definition.
             ;; Think of the filter as another set-def you must itersect the other parts
             ;; of this definition with to fully resolve this set definition.
             :setdef/filter                       {:db/cardinality :db.cardinality/one}


             })


(defonce sequences-db-schema {
             :mongodb/objectid                   {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
             :sequence/accession                 {:db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
             :sequence/binomial                  {:db/cardinality :db.cardinality/one}

             ;; Todo: Eventually allow more sequence information on client.
             ;; There is also more species information than the binomial available in the GenBank files, i.e. the ncbi_taxid
             ;; Will probably also need to enforce uniqueness on the clustal-schemes
            })


;; We do two client-side databases so sequence data (of which there will be a lot) doesn't have to be
;; pushed repeatedly in its entirety. (We can request entities as needed for sequences, because we'll
;; know from the job data or a dynamic form which ones we'll need). Job data is entirely an unknown,
;; but is small, so we can just poll for that.

(defonce sequences-db (d/create-conn sequences-db-schema))

(defc jobs-state {})
(defc jobs-error nil)
(defc jobs-loading [])

(defc sequences-state {})
(defc sequences-error nil)
(defc sequences-loading [])

(defc= jobs-entities (:entities jobs-state))
(defc= jobs-db (:db-after (d/with (d/empty-db jobs-db-schema) jobs-entities)))


;; Todo: wish there was a better way to query than just by name (i.e. what if no name?)

(defc= clustal-scheme-ids (d/q '[:find ?e :where [?e :clustalscheme/name ?name]] jobs-db))
(defc= analysis-set-ids (d/q '[:find ?e :where [?e :analysisset/name ?name]] jobs-db))
(defc= clustal-schemes (map (fn [e] (d/entity jobs-db (first e))) clustal-scheme-ids))
(defc= analysis-sets   (map (fn [e] (d/entity jobs-db (first e))) analysis-set-ids))

(defc  selected-clustal-scheme-id nil)
(defc  selected-analysis-set-id nil)
(defc= selected-clustal-scheme (if selected-clustal-scheme-id (d/entity jobs-db selected-clustal-scheme-id))) ;; Guard here, because if there are no schemes the selected id will be nil and d/entity will throw an exception on lazy eval.
(defc= selected-analysis-set   (if selected-analysis-set-id   (d/entity jobs-db selected-analysis-set-id))) ;; Guard here, because if there are no sets the selected id will be nil and d/entity will throw an exception on lazy eval.

;; Scheme-set Jobs
(defc= scheme-set-jobs (if (and selected-clustal-scheme selected-analysis-set)
                         (map (fn [e] (d/entity jobs-db (first e)))
                              (d/q '[:find ?e
                                     :in $ ?scheme [?set-def ...] ;; [?set-def ...] is all of the set definitions that use the analysisset's set-def for their filter
                                     :where [?e :job/setdef ?set-def] ;; Datomic docs say put most restricting clauses first for optimal performance, not sure if this applies to DataScript but doing it anyway
                                     [?e :job/clustalscheme ?scheme]] ;; Todo: Should check job/set-def/filter -> analysisset/set-def
                                   jobs-db
                                   (get selected-clustal-scheme :mongodb/objectid)
                                   ;; All set-def entities that use the selected analysisset's set-def as a filter
                                   (map (fn [e] (second e))
                                        (d/q '[:find ?e ?set-def-object-id
                                               :in $ ?analysisset-set-def
                                               :where [?e :setdef/filter ?analysisset-set-def]
                                                      [?e :mongodb/objectid ?set-def-object-id]]
                                             jobs-db
                                             (get selected-analysis-set :analysisset/setdef)))))))


(let [{:keys [chsk ch-recv send-fn state]}
      (sente/make-channel-socket! "/chsk"
       {:type :auto ; auto falls back on ajax if necessary
       })]
  (def chsk       chsk)
  (def ch-chsk    ch-recv) ; ChannelSocket's receive channel
  (def chsk-send! send-fn) ; ChannelSocket's send API fn
  (def chsk-state state)   ; Watchable, read-only atom
  )






;; ----------------------
;; Recieve Message Routing
;; (recv messages are always wrapped with :chsk/recv event,
;; so we unwrap and forward to these methods)
;; ----------------------
(defmulti recv-msg-handler :id)

(defmethod recv-msg-handler :default
  [{:as ev-msg :keys [event]}]
  (print "Unhandled recv event: " event))

(defmethod recv-msg-handler :rpc/recv-jobs-state
  [{:as ev-msg :keys [id ?data event]}]
  (do (print "Recv Jobs Data: " (pr-str ?data)) (reset! jobs-state ?data)))

  ; (let [[?jobs-state] ?data]
  ;   (print "In handler.")
  ;   (print "Jobs state: " ?jobs-state)))



;; ----------------------
;; Primary Channel Socket Routing
;; ----------------------

(defmulti event-msg-handler :id) ;; Dispatch on the event id

;; event-msg-handler* just calls event-msg-handler, but also logs the event
(defn event-msg-handler* [{:as ev-msg :keys [id ?data event]}]
  (print "Event: " event)
  (event-msg-handler ev-msg))

(defmethod event-msg-handler :default
  [{:as ev-msg :keys [id ?data event]}]
  (print "Unhandled event: " event))

(defmethod event-msg-handler :chsk/state
  [{:as ev-msg :keys [?data]}]
  (if (= (:first-open? ?data) true)
    (do
      (print "Channel socket successfully established! Sending data request message. ")
      ; Request the initial state for the ui. After this, the server will send
      ; a complete replacement state when updates have been made to the DB.
      (chsk-send! [:rpc/get-jobs-state] 5000 ; Timeout
                  (fn [cb-reply]             ; Callback with response
                    (if (sente/cb-success? cb-reply)
                      (do
                        ;;(print cb-reply)
                        (reset! jobs-state cb-reply)

                        )))))
    (print "Channel socket state change: " ?data)))

(defmethod event-msg-handler :chsk/recv
  [{:as ev-msg :keys [?data]}]
  (recv-msg-handler {:id (first ?data)
                     :?data (second ?data)
                     :event ?data}))

(defmethod event-msg-handler :chsk/handshake
  [{:as ev-msg :keys [?data]}]
  (let [[?uid ?csrf-token ?handshake-data] ?data]
    (print "Handshake: " ?data)))




(def router_ (atom nil))

(defn  stop-router! [] (when-let [stop-f @router_] (stop-f)))
(defn start-router! []
  (stop-router!)
  (reset! router_ (sente/start-chsk-router! ch-chsk event-msg-handler*)))

;; Init
;; Todo: Start router
(defn start! [] (start-router!))























