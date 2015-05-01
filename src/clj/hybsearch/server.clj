(ns hybsearch.server
  (:require [org.httpkit.server      :as hk     ]
            [ring.middleware.file    :as file   ]
            [ring.middleware.file-info    :as file-info   ]
            [compojure.core          :refer :all]
            [compojure.route         :as route  ]
            [ring.util.response      :as resp   ]
            [hybsearch.api           :as api    ]))

;; This creates a Ring handler for the routes.


(def server (atom nil))


(defroutes all-routes
  (GET "/" [] (resp/file-response "index.html" {:root "public"}))
  (route/resources "/")
  (route/not-found "404."))


(defn goto [port public-path]
  (swap! server #(or % (hk/run-server (-> all-routes
                                          (file/wrap-file public-path)
                                          (file-info/wrap-file-info))
                                      {:port port :join? false}))))