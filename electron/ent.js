'use strict'

const _ = require('lodash')

let kino = {
    "branchset": [{
        "name": "",
        "branchset": [{
            "name": "",
            "branchset": [{
                "name": "",
                "branchset": [{
                    "name": "",
                    "branchset": [{
                        "name": "",
                        "branchset": [{
                            "name": "",
                            "branchset": [{
                                "name": "25",
                                "length": 3001
                            }, {
                                "name": "12",
                                "length": 3001
                            }],
                            "length": 2999
                        }, {
                            "name": "",
                            "branchset": [{
                                "name": "26",
                                "length": 3001
                            }, {
                                "name": "7",
                                "length": 3001
                            }],
                            "length": 2998
                        }],
                        "length": 2998
                    }, {
                        "name": "",
                        "branchset": [{
                            "name": "",
                            "branchset": [{
                                "name": "",
                                "branchset": [{
                                    "name": "11",
                                    "length": 3001
                                }, {
                                    "name": "6",
                                    "length": 3001
                                }],
                                "length": 2998
                            }, {
                                "name": "",
                                "branchset": [{
                                    "name": "",
                                    "branchset": [{
                                        "name": "",
                                        "branchset": [{
                                            "name": "8",
                                            "length": 3001
                                        }, {
                                            "name": "15",
                                            "length": 3001
                                        }],
                                        "length": 2989
                                    }, {
                                        "name": "24",
                                        "length": 3001
                                    }],
                                    "length": 2997
                                }, {
                                    "name": "",
                                    "branchset": [{
                                        "name": "",
                                        "branchset": [{
                                            "name": "",
                                            "branchset": [{
                                                "name": "21",
                                                "length": 3001
                                            }, {
                                                "name": "20",
                                                "length": 3001
                                            }],
                                            "length": 2996
                                        }, {
                                            "name": "",
                                            "branchset": [{
                                                "name": "",
                                                "branchset": [{
                                                    "name": "17",
                                                    "length": 3001
                                                }, {
                                                    "name": "18",
                                                    "length": 3001
                                                }],
                                                "length": 2997
                                            }, {
                                                "name": "16",
                                                "length": 3001
                                            }],
                                            "length": 2999
                                        }],
                                        "length": 2024
                                    }, {
                                        "name": "",
                                        "branchset": [{
                                            "name": "22",
                                            "length": 3001
                                        }, {
                                            "name": "23",
                                            "length": 3001
                                        }],
                                        "length": 2039
                                    }],
                                    "length": 2997
                                }],
                                "length": 2998
                            }],
                            "length": 1948
                        }, {
                            "name": "4",
                            "length": 3001
                        }],
                        "length": 2998
                    }],
                    "length": 2998
                }, {
                    "name": "",
                    "branchset": [{
                        "name": "",
                        "branchset": [{
                            "name": "",
                            "branchset": [{
                                "name": "30",
                                "length": 3001
                            }, {
                                "name": "29",
                                "length": 3001
                            }],
                            "length": 2999
                        }, {
                            "name": "34",
                            "length": 3001
                        }],
                        "length": 2998
                    }, {
                        "name": "",
                        "branchset": [{
                            "name": "32",
                            "length": 3001
                        }, {
                            "name": "",
                            "branchset": [{
                                "name": "31",
                                "length": 3001
                            }, {
                                "name": "33",
                                "length": 3001
                            }],
                            "length": 3000
                        }],
                        "length": 2999
                    }],
                    "length": 2999
                }],
                "length": 2997
            }, {
                "name": "",
                "branchset": [{
                    "name": "",
                    "branchset": [{
                        "name": "",
                        "branchset": [{
                            "name": "",
                            "branchset": [{
                                "name": "3",
                                "length": 3001
                            }, {
                                "name": "2",
                                "length": 3001
                            }],
                            "length": 2999
                        }, {
                            "name": "9",
                            "length": 3001
                        }],
                        "length": 2999
                    }, {
                        "name": "",
                        "branchset": [{
                            "name": "13",
                            "length": 3001
                        }, {
                            "name": "14",
                            "length": 3001
                        }],
                        "length": 2999
                    }],
                    "length": 2999
                }, {
                    "name": "",
                    "branchset": [{
                        "name": "19",
                        "length": 3001
                    }, {
                        "name": "",
                        "branchset": [{
                            "name": "10",
                            "length": 3001
                        }, {
                            "name": "5",
                            "length": 3001
                        }],
                        "length": 2999
                    }],
                    "length": 1731
                }],
                "length": 2999
            }],
            "length": 2999
        }, {
            "name": "",
            "branchset": [{
                "name": "27",
                "length": 3001
            }, {
                "name": "28",
                "length": 3001
            }],
            "length": 2999
        }],
        "length": 3001
    }, {
        "name": "1",
        "length": 3001
    }],
    "name": ""
}

let sample = {
  name: "F",
  branchset: [
    {name: "A", length: 0.1},
    {name: "B", length: 0.2},
    {
      name: "E",
      length: 0.5,
      branchset: [
        {name: "C", length: 0.3},
        {name: "D", length: 0.4}
      ]
    }
  ]
}

let sample2 = {
  "branchset": [
    {
      "name": "Emydura_su",
      "length": 0.02236
    },
    {
      "name": "",
      "branchset": [
        {
          "name": "",
          "branchset": [
            {
              "name": "",
              "branchset": [
                {
                  "name": "Emydura_ta",
                  "length": 0.0017
                },
                {
                  "name": "Emydura_su",
                  "length": 0.00308
                }
              ],
              "length": 0.00053
            },
            {
              "name": "Emydura_ta",
              "length": 0.00306
            }
          ],
          "length": 0.03241
        },
        {
          "name": "",
          "branchset": [
            {
              "name": "",
              "branchset": [
                {
                  "name": "Emydura_vi",
                  "length": 0.00014,
                },
                {
                  "name": "Emydura_vi",
                  "length": 0.00104,
                }
              ],
              "length": 0.01137
            },
            {
              "name": "Emydura_ma",
              "length": 0.01893
            }
          ],
          "length": 0.04615
        },
      ],
      "length": 0.00798
    },
    {
      "name": "Emydura_su",
      "length": 0.01676
    }
  ],
  "name": ""
}

let longest = []
function walk(node, path) {
	path = path || []

	if (path.length > longest.length) {
		longest = path
	}

	if (node.branchset) {
		node.branchset.forEach((child, i) => {
			walk(child, path.concat(i))
		})
	}

	return longest
}

function recordnm(species1, species2){
  console.log("Nonmonophyly found: ",species1," and ",species2)
}

function marknm(node, species1, species2){
  if (node.branchset){
    marknm(node.branchset[0], species1, species2)
    marknm(node.branchset[1], species1, species2)
  }
  else{
    if (node.name === species1){
      node.nminner = node.nminner || []
      node.nminner.push(species2)
    }
    else if (node.name === species2){
      node.nmouter = node.nmouter || []
      node.nmouter.push(species1)
    }

  }

}

function mutatenm(node) {
  //console.log(node)
  if (!node.branchset) {
    //console.log("no branchset")
    return [node.name]
  }
  else{
    //console.log("has branchset")
    let speciesA = mutatenm(node.branchset[0])
    let speciesB = mutatenm(node.branchset[1])
    speciesA.forEach((species1) => {
      console.log(speciesB.indexOf(species1)," ",speciesB.every((x) => x === species1))
      if ((speciesB.indexOf(species1) > -1 ) && (speciesB.every((x) => x === species1))) {
        speciesB.forEach((species2) => {
          if (species2 !== species1){
            marknm(node, species1, species2)
            recordnm(species1, species2)
            //console.log("markednm called on ",species1," and ",species2)
          }
        })
        speciesA.forEach((species3) => {
          if (species3 !== species1){
            marknm(node, species1, species3)
            recordnm(species1, species3)
            //console.log("markednm called on ",species1," and ",species3)
          }
        })
      }
    })
    let species_list = []
    species_list = species_list.concat(speciesA, speciesB)
    //console.log(species_list)

    return species_list
  }
}

function main() {
  let ntree = _.cloneDeep(sample2)

  mutatenm(ntree)

  console.log(JSON.stringify(ntree, null, 2))
  // mutatenm(sample2)
  // console.log(JSON.stringify(sample2, null, 2))
}

if (require.main === module) {
  main()
}
