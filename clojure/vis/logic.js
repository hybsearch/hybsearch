function load(newickStr) {
	var newick = Newick.parse(newickStr)
	var newickNodes = []

	function buildNewickNodes(node, callback) {
		newickNodes.push(node)
		if (node.branchset) {
			for (var i = 0; i < node.branchset.length; i++) {
				buildNewickNodes(node.branchset[i])
			}
		}
	}
	buildNewickNodes(newick)

	console.log("Got nodes:", newickNodes);
	
	// Find the min and max to calc width
	var smallest = getSmallestLength(newickNodes, Infinity);
	var largest = getLargestLength(newickNodes, 0);
	var ratio = (largest/smallest);
	console.log("Width ratio is", ratio);

	d3.phylogram.build('#phylogram', newick, {
		width: 25 * ratio,
		height: 800
	});
}

function getSmallestLength(objs, smallest) {
	for (i in objs) {
		var obj = objs[i];

		var length = obj.length;
		if (length && length < smallest) {
			smallest = length;
		}

		if (obj.branchset && obj.branchset.length > 0) {
			var sub = getSmallestLength(obj.branchset, smallest);
			if (sub < smallest) {
				smallest = sub;
			}
		}
	}

	return smallest;
}

function getLargestLength(objs, largest) {
	for (i in objs) {
		var obj = objs[i];

		var length = obj.length;
		if (length && length > largest) {
			largest = length;
		}

		if (obj.branchset && obj.branchset.length > 0) {
			var sub = getLargestLength(obj.branchset, largest);
			if (sub > largest) {
				largest = sub;
			}
		}
	}

	return largest;
}

// Whitelist is an array of individuals for a single species. Anything not
// in this whitelist must be nonmono
function findOutliers(objs, whitelist, found) {
	for (i in objs) {
		var obj = objs[i];

		if (obj.name && obj.name != "" && whitelist.indexOf(obj.name) == -1) {
			found.push(obj.name + "_" + obj.length);
		}

		if (obj.branchset && obj.branchset.length > 0) {
			found = findOutliers(obj.branchset, whitelist, found);
		}
	}

	return found;
}

function onNodeClicked(data) {
	console.log("##Clicked on node point with data: ", data);

	var outliers = findOutliers(data.branchset, getWhitelist(), []);
	console.log("##Outliers found:", outliers);

	for (i in outliers) {
		var outlier = outliers[i];

		document.getElementById(outlier).setAttribute("fill", "green");
	}

	alert("Node analysis complete! Non-dominant species for the specified subtree are marked green. For a comprehensive list, please view the browser console logs.")
}

function getWhitelist() {
	return document.getElementById("dominantSpeciesInput").value.split(",")
}

function cleanup() {
	document.getElementById("phylogram").innerHTML = ""
}

document.getElementById("submit").onclick = function() {
	loadFromTextarea()
}

function loadFromTextarea() {
	var input = document.getElementById("newickInput").value
	cleanup()
	console.log("##Loading: ", input);
	load(input)
}

loadFromTextarea();