#!/usr/bin/env boot

#tailrecursion.boot.core/version "2.5.1"

(set-env!
  :project      'hybsearch
  :version      "0.1.0-SNAPSHOT"
  :dependencies '[[tailrecursion/boot.task   "2.2.4"]
                  [tailrecursion/hoplon      "5.10.25"]
                  ;;[tailrecursion/javelin     "3.8.0"]
                  [exicon/hoplon5-semantic-ui "1.10.2-SNAPSHOT"]
                  [org.clojure/clojurescript "0.0-3119"]
                  ;; 3119 (release) and 3178 (pre-release) are the latest clojurescript compilers
                  ;; that I could get datascript to build error-free with. 3190 breaks with ArityException.
                  ;; Some of the compilers in the 2xxx range (maybe even all, I forget where it stopped) throw a bunch of undeclared
                  ;; var warnings, and then there are JS issues when the page tries to include datascript. The default
                  ;; compiler that boot was using also did this. I have a hunch that the default was 2814-4, but have not confirmed.
                  [datascript "0.10.0"]
                  [org.mongodb/mongo-java-driver "3.0.0"]
                  [org.mongodb/bson "3.0.0"]
                  [com.novemberain/monger "2.1.0"]]
  :out-path     "resources/public"
  :src-paths    #{"src/hl" "src/cljs" "src/clj"})

;; Static resources (css, images, etc.):
(add-sync! (get-env :out-path) #{"assets"})

(require '[tailrecursion.hoplon.boot :refer :all]
         '[tailrecursion.castra.task :as c])

;; Todo: Modify core.clj so it uses http-kit or immutant and we can do websockets for everything (maybe still POST for uploads and forms...).


(deftask development
  "Build hybsearch for development."
  []
  (comp (watch) (hoplon {:prerender false}) (c/castra-dev-server 'hybsearch.api)))

(deftask dev-debug
  "Build hybsearch for development with source maps."
  []
  (comp (watch) (hoplon {:pretty-print true
                         :prerender false
                         :source-map true}) (c/castra-dev-server 'hybsearch.api)))

(deftask production
  "Build hybsearch for production."
  []
  (hoplon {:optimizations :advanced}))
