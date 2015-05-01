(ns hybsearch.devserver
  (:require [tailrecursion.boot.core :as core]
            [hybsearch.server :as server]))

;; Boot task for launching server with `boot development` task
(core/deftask goto
              "roflcopter"
              []
              (core/with-pre-wrap (server/goto 8000 (core/get-env :out-path))))

