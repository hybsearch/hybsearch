/* eslint-disable */
/*
  d3.phylogram.js
  Wrapper around a d3-based phylogram (tree where branch lengths are scaled)
  Also includes a radial dendrogram visualization (branch lengths not scaled)
  along with some helper methods for building angled-branch trees.

  Copyright (c) 2013, Ken-ichi Ueda

  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer. Redistributions in binary
  form must reproduce the above copyright notice, this list of conditions and
  the following disclaimer in the documentation and/or other materials
  provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.

  DOCUEMENTATION

  d3.phylogram.build(selector, nodes, options)
    Creates a phylogram.
    Arguments:
      selector: selector of an element that will contain the SVG
      nodes: JS object of nodes
    Options:
      width
        Width of the vis, will attempt to set a default based on the width of
        the container.
      height
        Height of the vis, will attempt to set a default based on the height
        of the container.
      vis
        Pre-constructed d3 vis.
      tree
        Pre-constructed d3 tree layout.
      children
        Function for retrieving an array of children given a node. Default is
        to assume each node has an attribute called "branchset"
      diagonal
        Function that creates the d attribute for an svg:path. Defaults to a
        right-angle diagonal.
      skipTicks
        Skip the tick rule.
      skipBranchLengthScaling
        Make a dendrogram instead of a phylogram.

  d3.phylogram.buildRadial(selector, nodes, options)
    Creates a radial dendrogram.
    Options: same as build, but without diagonal, skipTicks, and
      skipBranchLengthScaling

  d3.phylogram.rightAngleDiagonal()
    Similar to d3.diagonal except it create an orthogonal crook instead of a
    smooth Bezier curve.

  d3.phylogram.radialRightAngleDiagonal()
    d3.phylogram.rightAngleDiagonal for radial layouts.
*/

var d3 = require('d3')
const flatten = require('lodash/flatten')
const uniq = require('lodash/uniq')

var phylogram = {}
phylogram.rightAngleDiagonal = () => {
	let projection = d => [d.y, d.x]
	let path = pathData => `M${pathData[0]} ${pathData[1]} ${pathData[2]}`

	function diagonal(diagonalPath, i) {
		let source = diagonalPath.source
		let target = diagonalPath.target
		let midpointX = (source.x + target.x) / 2
		let midpointY = (source.y + target.y) / 2

		let pathData = [source, { x: target.x, y: source.y }, target].map(
			projection
		)

		return path(pathData)
	}

	diagonal.projection = function(x) {
		if (!arguments.length) return projection
		projection = x
		return diagonal
	}

	diagonal.path = function(x) {
		if (!arguments.length) return path
		path = x
		return diagonal
	}

	return diagonal
}

phylogram.radialRightAngleDiagonal = () => {
	return phylogram
		.rightAngleDiagonal()
		.path(pathData => {
			let src = pathData[0]
			let mid = pathData[1]
			let dst = pathData[2]
			let radius = Math.sqrt(src[0] * src[0] + src[1] * src[1])
			let srcAngle = phylogram.coordinateToAngle(src, radius)
			let midAngle = phylogram.coordinateToAngle(mid, radius)
			let clockwise =
				Math.abs(midAngle - srcAngle) > Math.PI
					? midAngle <= srcAngle
					: midAngle > srcAngle
			let rotation = 0
			let largeArc = 0
			let sweep = clockwise ? 0 : 1
			return `M${src} A${[
				radius,
				radius,
			]} ${rotation} ${largeArc},${sweep} ${mid}L${dst}`
		})
		.projection(d => {
			let r = d.y
			let a = (d.x - 90) / 180 * Math.PI
			return [r * Math.cos(a), r * Math.sin(a)]
		})
}

// Convert XY and radius to angle of a circle centered at 0,0
phylogram.coordinateToAngle = (coord, radius) => {
	let wholeAngle = 2 * Math.PI
	let quarterAngle = wholeAngle / 4

	let coordQuad =
		coord[0] >= 0 ? (coord[1] >= 0 ? 1 : 2) : coord[1] >= 0 ? 4 : 3

	let coordBaseAngle = Math.abs(Math.asin(coord[1] / radius))

	// Since this is just based on the angle of the right triangle formed by
	// the coordinate and the origin, each quad will have different offsets
	switch (coordQuad) {
		case 1:
			return quarterAngle - coordBaseAngle
		case 2:
			return quarterAngle + coordBaseAngle
		case 3:
			return 2 * quarterAngle + quarterAngle - coordBaseAngle
		case 4:
			return 3 * quarterAngle + coordBaseAngle
	}
}

phylogram.styleTreeNodes = (vis, onClickFunc) => {
	vis
		.selectAll('g.leaf.node')
		.append('svg:circle')
		.attr('r', 4)
		.classed('leaf-dot', true)
		.classed('clickable-node', true)
		.on('click', onClickFunc)
		// .attr('data-ident', node => node.ident)
		.attr('id', d => `${d.name}_${d.length}`)

	vis
		.selectAll('g.root.node')
		.append('svg:circle')
		.attr('r', 4)
	//.classed('clickable-node', true)
	//.on('click', onClickFunc)
}

function visitPreOrder(root, callback) {
	callback(root)
	if (root.children) {
		root.children.forEach(child => visitPreOrder(child, callback))
	}
}

function scaleBranchLengths(nodes, w) {
	// Visit all nodes and adjust y pos width distance metric
	visitPreOrder(nodes[0], node => {
		node.rootDist =
			(node.parent ? node.parent.rootDist : 0) + (node.length || 0)
	})

	var rootDists = nodes.map(n => n.rootDist)
	var yscale = d3.scale
		.linear()
		.domain([0, d3.max(rootDists)])
		.range([0, w])

	visitPreOrder(nodes[0], node => {
		node.y = yscale(node.rootDist)
	})

	return yscale
}

phylogram.build = function(selector, nodes, options = {}) {
	let onNodeClicked = options.onNodeClicked
	let h = options.height || d3.select(selector).style('height')
	let w = options.width || d3.select(selector).style('width')
	h = parseInt(h)
	w = parseInt(w)

	let formatLeafNodeLabel = options.formatLeafNodeLabel || (node => node.name)

	let tree =
		options.tree ||
		d3.layout
			.cluster()
			.size([h, w])
			.sort(node => (node.children ? node.children.length : -1))
			.children(options.children || (node => node.branchset))

	let diagonal = options.diagonal || phylogram.rightAngleDiagonal()

	let vis =
		options.vis ||
		d3
			.select(selector)
			.append('svg:svg')
			.attr('width', w + 420)
			.attr('height', h + 30)
			.append('svg:g')
			.attr('transform', 'translate(20, 20)')

	nodes = tree(nodes)

	let yscale
	if (options.skipBranchLengthScaling) {
		yscale = d3.scale
			.linear()
			.domain([0, w])
			.range([0, w])
	} else {
		yscale = scaleBranchLengths(nodes, w)
	}

	if (!options.skipTicks) {
		vis
			.selectAll('line')
			.data(yscale.ticks(10))
			.enter()
			.append('svg:line')
			.attr('y1', 0)
			.attr('y2', h)
			.attr('x1', yscale)
			.attr('x2', yscale)
			.attr('stroke', '#ddd')

		vis
			.selectAll('text.rule')
			.data(yscale.ticks(10))
			.enter()
			.append('svg:text')
			.classed('rule', true)
			.attr('x', yscale)
			.attr('y', 0)
			.attr('dy', -3)
			.attr('text-anchor', 'middle')
			.attr('font-size', '8px')
			.attr('fill', '#ccc')
			.text(d => Math.round(d * 100) / 100)
	}

	let link = vis
		.selectAll('path.link')
		.data(tree.links(nodes))
		.enter()
		.append('svg:path')
		.classed('link', true)
		.attr('d', diagonal)
		.attr('fill', 'none')
		.attr('stroke', '#1d1d1d')
		.attr('stroke-width', '1px')

	let nm = options.nonmonophyly || []

	let sourceNmIdents = nm.map(pair => pair[0])
	let targetNmIdents = nm.map(pair => pair[1])
	let allNmIdents = uniq(flatten(nm))

	let node = vis
		.selectAll('g.node')
		.data(nodes)
		.enter()
		.append('svg:g')
		.attr('class', node => {
			if (node.children) {
				if (node.depth === 0) {
					return 'root node'
				}
				return 'inner node'
			}
			return 'leaf node'
		})
		.classed('nonmonophyletic', d => allNmIdents.includes(d.ident))
		.attr('transform', d => `translate(${d.y},${d.x})`)
		.attr('data-ident', node => node.ident)

	phylogram.styleTreeNodes(vis, onNodeClicked)

	if (!options.skipLabels) {
		vis
			.selectAll('g.inner.node')
			.append('svg:text')
			.attr('dx', -6)
			.attr('dy', -6)
			.classed('divergence-label', true)
			.text(d => d.length)

		vis
			.selectAll('g.leaf.node')
			.append('svg:text')
			.attr('dx', 8)
			.attr('dy', 4)
			.classed('species-label', true)
			.text(formatLeafNodeLabel)
	}

	// let nodes = vis.selectAll('g.leaf.node[data-ident]')

	// let sourceNodes = nodes
	// 	.filter(d => includes(sourceNmIdents, d.ident))
	// 	.append('path')

	// let targetNodes = nodes
	// 	.filter(d => includes(sourceNmIdents, d.ident))

	return {
		tree: tree,
		vis: vis,
	}
}

module.exports = phylogram
