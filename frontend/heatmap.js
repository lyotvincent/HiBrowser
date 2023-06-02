var classesNumber = 10,
    cellSize = 24;

    
function heatmap_display(url, heatmapId, paletteName) {
    var tooltip = d3.select(heatmapId)
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden");

    //==================================================
    // http://bl.ocks.org/mbostock/3680958
    function zoom() {
    	svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    //==================================================
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();
    var viewerPosTop = 200;
    var viewerPosLeft = 100;

    var legendElementWidth = cellSize * 2;
    var colors = colorbrewer[paletteName][classesNumber];
    var svg;

    //==================================================
    d3.json(url, function(error, data) {

        console.log(data);
        var arr = data.data;
        var colorScale = d3.scale.quantize()
            .domain([0.0, 1.0])
            .range(colors);

        svg = d3.select(heatmapId).append("svg")
            .attr("width", viewerWidth)
            .attr("height", viewerHeight)
	    .call(zoomListener)
            .append("g")
            .attr("transform", "translate(" + viewerPosLeft + "," + viewerPosTop + ")");

        svg.append('defs')
            .append('pattern')
            .attr('id', 'diagonalHatch')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 4)
            .attr('height', 4)
            .append('path')
            .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
            .attr('stroke', '#000000')
            .attr('stroke-width', 1);
        var rowLabels = svg.append("g")
            .attr("class", "rowLabels")
            .selectAll(".rowLabel")
            .data(data.index)
            .enter().append("text")
            .text(function(d) {
                return d.count > 1 ? d.join("/") : d;
            })
            .attr("x", 0)
            .attr("y", function(d, i) {
                return (i * cellSize);
            })
            .style("text-anchor", "end")
            .attr("transform", function(d, i) {
                return "translate(-3," + cellSize / 1.5 + ")";
            })
            .attr("class", "rowLabel mono")
            .attr("id", function(d, i) {
                return "rowLabel_" + i;
            });

        var colLabels = svg.append("g")
            .attr("class", "colLabels")
            .selectAll(".colLabel")
            .data(data.columns)
            .enter().append("text")
            .text(function(d) {
                d.shift();
                return d.count > 1 ? d.reverse().join("/") : d.reverse();
            })
            .attr("x", 0)
            .attr("y", function(d, i) {
                return (i * cellSize);
            })
            .style("text-anchor", "left")
            .attr("transform", function(d, i) {
                return "translate(" + cellSize / 2 + ", -3) rotate(-90) rotate(45, 0, " + (i * cellSize) + ")";
            })
            .attr("class", "colLabel mono")
            .attr("id", function(d, i) {
                return "colLabel_" + i;
            });

        var row = svg.selectAll(".row")
            .data(data.data)
            .enter().append("g")
            .attr("id", function(d) {
                return d.idx;
            })
            .attr("class", "row");

        var j = 0;
        var heatMap = row.selectAll(".cell")
            .data(function(d) {
                j++;
                return d;
            })
            .enter().append("svg:rect")
            .attr("x", function(d, i) {
                return i * cellSize;
            })
            .attr("y", function(d, i, j) {
                return j * cellSize;
            })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("class", function(d, i, j) {
                return "cell bordered cr" + j + " cc" + i;
            })
            .attr("row", function(d, i, j) {
                return j;
            })
            .attr("col", function(d, i, j) {
                return i;
            })
            .attr("width", cellSize)
            .attr("height", cellSize)
            .style("fill", function(d) {
                if (d != null) return colorScale(d);
                else return "url(#diagonalHatch)";
            })
            .on('mouseover', function(d, i, j) {
                d3.select('#colLabel_' + i).classed("hover", true);
                d3.select('#rowLabel_' + j).classed("hover", true);
                if (d != null) {
                    tooltip.html('<div class="heatmap_tooltip">' + d.toFixed(3) + '</div>');
                    tooltip.style("visibility", "visible");
                } else
                    tooltip.style("visibility", "hidden");
            })
            .on('mouseout', function(d, i, j) {
                d3.select('#colLabel_' + i).classed("hover", false);
                d3.select('#rowLabel_' + j).classed("hover", false);
                tooltip.style("visibility", "hidden");
            })
            .on("mousemove", function(d, i) {
                tooltip.style("top", (d3.event.pageY - 55) + "px").style("left", (d3.event.pageX - 60) + "px");
            })
            .on('click', function() {
                //console.log(d3.select(this));
            });

        var legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(0,-300)")
            .selectAll(".legendElement")
            .data([0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
            .enter().append("g")
            .attr("class", "legendElement");

        legend.append("svg:rect")
            .attr("x", function(d, i) {
                return legendElementWidth * i;
            })
            .attr("y", viewerPosTop)
            .attr("class", "cellLegend bordered")
            .attr("width", legendElementWidth)
            .attr("height", cellSize / 2)
            .style("fill", function(d, i) {
                return colors[i];
            });

        legend.append("text")
            .attr("class", "mono legendElement")
            .text(function(d) {
                return "≥" + Math.round(d * 100) / 100;
            })
            .attr("x", function(d, i) {
                return legendElementWidth * i;
            })
            .attr("y", viewerPosTop + cellSize);



        //==================================================
        d3.select("#palette")
            .on("keyup", function() {
		var newPalette = d3.select("#palette").property("value");
		if (newPalette != null)						// when interfaced with jQwidget, the ComboBox handles keyup event but value is then not available ?
                	changePalette(newPalette, heatmapId);
            })
            .on("change", function() {
		var newPalette = d3.select("#palette").property("value");
                changePalette(newPalette, heatmapId);
            });
    });

    //==================================================
}

//#########################################################
function changePalette(paletteName, heatmapId) {
    var colors = colorbrewer[paletteName][classesNumber];
    var colorScale = d3.scale.quantize()
        .domain([0.0, 1.0])
        .range(colors);
    var svg = d3.select(heatmapId);
    var t = svg.transition().duration(500);
    t.selectAll(".cell")
        .style("fill", function(d) {
                if (d != null) return colorScale(d);
                else return "url(#diagonalHatch)";
        })
    t.selectAll(".cellLegend")
        .style("fill", function(d, i) {
            return colors[i];
        });
}
