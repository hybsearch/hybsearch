(ns hybsearch.devserver
  (:require [tailrecursion.boot.core :as core]
            [hybsearch.server :as server]
            [org.httpkit.server :as hk]
            [ring.middleware.reload :as reload]))

;; Boot task for launching server with `boot development` task
(core/deftask goto
              "roflcopter"
              []
              (core/with-pre-wrap
                (do
                  (server/start-router!)
                  (swap! server/server
                         #(or % (hk/run-server ;; Add additional middleware here if desired
                                    (server/middleware (core/get-env :out-path))
                                  {:port 8000 :join? false}))))))



