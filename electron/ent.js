'use strict'


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
                  "branchset": [
                  	{"name": "alkjdals", "length": 1}
                  ]
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

console.log(walk(sample2))
