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

             :analysisset/name                    {:db/cardinality :db.cardinality/one}
             :analysisset/sequences               {:db/cardinality :db.cardinality/one} ;; Number of sequences

             :job/clustalscheme                   {:db/cardinality :db.cardinality/one}
             :job/analysisset                     {:db/cardinality :db.cardinality/one}
             :job/status                          {:db/cardinality :db.cardinality/one}
             :job/errors                          {:db/cardinality :db.cardinality/many}
             :job/initialized                     {:db/cardinality :db.cardinality/one}
             :job/triples                         {:db/cardinality :db.cardinality/one}
             :job/processed                       {:db/cardinality :db.cardinality/one}
             :job/avgtime                         {:db/cardinality :db.cardinality/one}
             })

(defc jobs-state {})
(defc jobs-error nil)
(defc jobs-loading [])

(defc analysis-set-seqs {}) ;; Stores the sequences for each analysis set
(defc query-results {})

(defc= jobs-entities (:entities jobs-state))
(defc= jobs-db (:db-after (d/with (d/empty-db jobs-db-schema) jobs-entities)))

(defc= clustal-scheme-ids (d/q '[:find ?e :where [?e :clustalscheme/name ?name]] jobs-db))
(defc= analysis-set-ids (d/q '[:find ?e :where [?e :analysisset/name ?name]] jobs-db))
(defc= clustal-schemes (map (fn [e] (d/entity jobs-db (first e))) clustal-scheme-ids))
(defc= analysis-sets   (map (fn [e] (d/entity jobs-db (first e))) analysis-set-ids))

(defc  selected-clustal-scheme-id nil)
(defc  selected-analysis-set-id nil)
(defc= selected-clustal-scheme (if selected-clustal-scheme-id (d/entity jobs-db selected-clustal-scheme-id))) ;; Guard here, because if there are no schemes the selected id will be nil and d/entity will throw an exception on lazy eval.
(defc= selected-analysis-set   (if selected-analysis-set-id   (d/entity jobs-db selected-analysis-set-id))) ;; Guard here, because if there are no sets the selected id will be nil and d/entity will throw an exception on lazy eval.

(def prev-update-num (atom 0))
(defc= scheme-set-job (when (and selected-clustal-scheme selected-analysis-set)
                        ;; We wrap the query result in a vector with a new number
                        ;; at the end because Javelin can't tell that the job changed
                        ;; based on the query result alone. The new number triggers
                        ;; propagation to continue.
                        (swap! prev-update-num #(mod (inc %) 2))
                        (vector
                          (d/entity jobs-db
                                    (first (first
                                             (d/q '[:find ?e
                                                    :in $ ?scheme ?set
                                                    :where [?e :job/clustalscheme ?scheme]
                                                           [?e :job/analysisset ?set]]
                                                  jobs-db
                                                  (:mongodb/objectid selected-clustal-scheme)
                                                  (:mongodb/objectid selected-analysis-set)))))
                          @prev-update-num)))

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
  [{:as ev-msg :keys [?data]}]
  (do (print "Recv Jobs Data") (reset! jobs-state ?data)))

(defmethod recv-msg-handler :rpc/recv-analysis-set-sequences
  [{:as ev-msg :keys [?data]}]
  (reset! analysis-set-seqs ?data))


;; ----------------------
;; Primary Channel Socket Routing
;; ----------------------

(defmulti event-msg-handler :id) ;; Dispatch on the event id

;; event-msg-handler* just calls event-msg-handler, but also logs the event
(defn event-msg-handler* [{:as ev-msg :keys [id ?data event]}]
  ;;(print "Event: " event)
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
                      (reset! jobs-state cb-reply))))
      (chsk-send! [:rpc/get-analysis-set-sequences] 5000 ; Timeout
                  (fn [cb-reply]             ; Callback with response
                    (if (sente/cb-success? cb-reply)
                      (reset! analysis-set-seqs cb-reply))))
      )
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

; ---------------
; Job RPC over channel-socket
; ---------------
(defn run-job [id]
  (chsk-send! [:rpc/run-job id]))

(defn pause-job [id]
  (chsk-send! [:rpc/pause-job id]))

; ---------------
; Query RPC over channel-socket
; ---------------
(defn query-nonmonophyly [job-id]
  (chsk-send! [:rpc/query-nonmonophyly job-id] 5000
              (fn [cb-reply]
                (when (sente/cb-success? cb-reply)
                  (swap! query-results assoc-in [job-id] cb-reply)))))


(def router_ (atom nil))

(defn  stop-router! [] (when-let [stop-f @router_] (stop-f)))
(defn start-router! []
  (stop-router!)
  (reset! router_ (sente/start-chsk-router! ch-chsk event-msg-handler*)))

;; Init
(defn start! [] (start-router!))
