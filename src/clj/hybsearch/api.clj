(ns hybsearch.api)


;; -----------------------------------------------------
;;  RPC for mutating the database
;; -----------------------------------------------------
(defn upload-loci [loci] nil)



;; -----------------------------------------------------
;; -----------------------------------------------------

(def seed-locus-data [
                {:db/id -20
                 :locus/accession     "HM233091"
                 :locus/binomial      "Lepus mandshuricus"}
                {:db/id -21
                 :locus/accession     "AB687524"
                 :locus/binomial      "Lepus timidus"}
                {:db/id -22
                 :locus/accession     "AB687525"
                 :locus/binomial      "Lepus timidus"}])


(def seed-jobs-data [
                {:db/id -1
                 :clustalscheme/name       "Scheme 1"
                 :clustalscheme/exsetting "Example Option 1"
                 :clustalscheme/numtriples 900
                 :clustalscheme/numproctriples 23
                 } ;; Todo: Maybe even allow people to view and manage their clustal schemes separately from analysis sets

                {:db/id -80
                 :clustalscheme/name       "Scheme 2"
                 :clustalscheme/exsetting "Example Option 2"
                 :clustalscheme/numtriples 900
                 :clustalscheme/numproc 67
                 }

                ;; This will act as the set def for one of our example analysis sets
                {:db/id -90
                 :setdef/loci ["HM233091", "AB687524", "AB687525"]}

                ;; This will be the set def for our example jobs
                {:db/id -1000
                 :setdef/binomials ["Lepus timidus", "Lepus mandshuricus"]
                 :setdef/filter -90}

                {:db/id -100
                 :setdef/loci []}


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
                 :analysisset/jobs [-2, -3]
                 :analysisset/clustalscheme -80
                 :analysisset/setdef -90
                 :analysisset/numtriples 1
                 :analysisset/numproc 1}

                {:db/id -4
                 :analysisset/name "Empty Set"
                 :analysisset/jobs []
                 :analysisset/clustalscheme -1
                 :analysisset/setdef -100
                 :analysisset/numtriples 0
                 :analysisset/numproc 0}

                ])


; Todo: Fix later
; (defn get-jobs-state []
;   {:rpc/query [{:entities seed-jobs-data}]})


(defn create-clustalscheme [clustalscheme] nil)
(defn create-analysisset [analysisset] nil)



;; (defrpc diffs-since [version]
;;   {:rpc/query [{:diffs seed-data
;;                 :source-version version
;;                 :dest-version 1}]} nil)

