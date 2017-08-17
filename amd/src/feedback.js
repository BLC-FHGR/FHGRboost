define(['exports', 'jquery', 'theme_htwboost/d3'], function(exports, $, d3) {
/* global d3*/

// FIXME: Moodle prefers AMD Syntax over the Global Scope.
// Reference: http://www.integralist.co.uk/posts/AMD.html

var svgRoot, graph, xaxis;

// get params of the url to get dataset id
$.urlParam = function (name) {
    var results = new RegExp("[\?&]" + name + "=([^&#]*)").exec(window.location.href);

    if (results === null) {
        return null;
    }
    return results[1] || 0;
};


function initSVGRoot() {
    // create or clear the SVG area
    if (!svgRoot) {
        svgRoot = d3.select("#feedback_analysis")
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%");
    }
    else {
        // clear the SVG area
        svgRoot.selectAll("*").remove();
    }
}

function renderAxis(labels, d3Item) {
    return d3Item.selectAll("text")
        .data(labels)
        .enter()
        .append("text")
        .text(function axisLabel(labelItem) {
            return labelItem.text;
        });
}

// returns the endpoints of the whiskers
function ipr(k, a) {
    var q1  = d3.quantile(a, 0.25),
            q3  = d3.quantile(a, 0.75),
            iqr = (q3 - q1) * k,
            i   = 0,
            j   = a.length - 1;

    if (isNaN(q3)) {
        q3 = d3.median(a);
    }
    if (isNaN(q1)) {
        q1 = d3.median(a);
    }

    while (a[i] < q1 - iqr) {
        i += 1;
    }
    while (a[j] > q3 + iqr) {
        j -= 1;
    }
    return [i, j];
}

function extractQuestionLabels(data) {
    // The question labels are the short names/question identifiers. This keeps the
    // UI less cluttered.
    return data.map(function (d, i) {
        // in the case a question has no label set, we use the question.
        if (!d.label || !d.label.length) {
            d.label = d.question;
        }

        return {
            text: d.label,
            xVal: 0,
            yVal: i + 1
        };
    });
}

function loadChartResults(renderer, loader) {
    var baseurl = "/local/powertla/rest.php/content/survey/results/" + $.urlParam("id");

    $.ajax({
        url: baseurl,
        type: "get",
        cache: false,
        dataType: "json",
        error: function () {
            checkLiveUpdate(loader);
        },
        success: function (data) {
            if (typeof data === "string") { // ensure a data array
                data = JSON.parse(data);
            }
            renderer(data);
            checkLiveUpdate(loader);
        }
    });
}

function loadBoxChart() {
    loadChartResults(renderBoxChart, loadBoxChart);
}

function loadBubbleChart() {
    loadChartResults(renderBubbleChart, loadBubbleChart);
}

function renderBoxChart(data) {
    svgRoot.selectAll("*").remove();
    graph = null;

    var i;
    var absMin = 0;
    var absMax = 0;

    var rdata = [];
    var edata = [];
    var bdata = [];
    var odata = {};

    var sdata = [];

    for (i = 0; i < data.length; i++) {
        switch (data[i].typ) {
                case "numeric":
                    rdata.push(data[i]);
                    break;
                default:
                    break;
        }
    }

    // process the incoming data
    for (i = 0; i < rdata.length; i++) {
        rdata[i].answers = rdata[i].answers.map(function (d) { return +d; });

        sdata = rdata[i].answers.sort(function (a, b) { return +a - +b; });

        // console.log(sdata);
        odata = {
            text: rdata[i].question,
            median: d3.median(sdata),
            q1: d3.quantile(sdata, 0.25),
            q3: d3.quantile(sdata),
            ipr: ipr(1.5, sdata),
            y: i,
            data: sdata
        };

        if (isNaN(odata.q3)) {
            odata.q3 = odata.median;
        }
        if (isNaN(odata.q1)) {
            odata.q1 = odata.median;
        }
        if (odata.q1 === odata.q3) {
            odata.q1 = odata.q1 - 1;
        }
        edata.push(d3.extent(rdata[i].answers));
        bdata.push(odata);
    }

    // overall chart ranges
    absMin = d3.min(edata.map(function (d) { return d[0]; }));
    absMax = d3.max(edata.map(function (d) { return d[1]; }));

    // the y lables are the questions.
    var bbox = {
        width: Math.floor($("#feedback_analysis").width()),
        height: Math.floor($("#feedback_analysis").height())
    };

    // reverse the y axis, so 0 is on top
    var yscale = d3.scale.linear()
                   .domain([rdata.length + 1, 0])
                   .range( [rdata.length * 50, 0]);

    var yLabels = extractQuestionLabels(rdata);
    var xLabels = [absMin, 0, absMax];

   // add the y axis labels
    if (!$("#y-axis").length) {
        svgRoot.append("g")
            .attr("id", "y-axis")
            .attr("transform","translate(20," + 10 + ")")
            .selectAll("text")
            .data(yLabels)
            .enter()
            .append("text")
            .text(function axisLabel(labelItem) {
                return labelItem.text;
            })
            .attr("text-anchor", "right")
            .attr("y", function (d) {
                return yscale(d.yVal);
            })
            .attr("dy", "0.3ex");
    }

    var ybbox = d3.select("#y-axis").node().getBBox();
    var yaxisWidth = ybbox.width + 25;
   // console.log("yaxis width " + yaxisWidth);


    $("#feedback_analysis").height(Math.floor(ybbox.height));

   // console.log(bbox.width + " " +  yaxisWidth);

    var xscale = d3.scale.linear()
                  .domain([absMin - 5, +absMax + 5])
                  .range([0, bbox.width - Math.floor(yaxisWidth)]);

    if (!$("#x-axis").length) {
        xaxis = svgRoot.append("g")
             .attr("id", "x-axis")
             .attr("transform","translate( " + yaxisWidth + ",10)");
    }

    var tx = xaxis.selectAll("text")
       .data(xLabels);

    tx.enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", function (d) {
            return xscale(d);
        })
        .text(function(d) { return d; });

    tx.exit().remove();

    if (!$("#boxdata").length) {
        graph = svgRoot.append("g")
                      .attr("id", "boxdata")
                      .attr("transform","translate(" + yaxisWidth + ",10)");
    }

    graph.selectAll("rect")
        .data(bdata)
        .enter()
        .append("rect")
        .attr("r", 2)
        .attr("class", function () {
            return "blue";
        })
        .attr("y", function (d) {
            return yscale(d.y + 1 - 0.2);
        })
        .attr("x", function (d) {
        // console.log(d.q1);
            return xscale(d.q1);
        })
        .attr("width", function (d) {
            var q3 = d.q3;

            if (isNaN(q3)) {
                q3 = d.median;
            }
        // console.log( q3 + " - " +  d.q1 + " = " + (q3 - d.q1) +  " .. " + xscale((q3 - d.q1)));
            return xscale(q3) - xscale(d.q1);
        })
        .attr("height", function () { return yscale(0.4); });

    var tb = graph.selectAll("line")
    .data(bdata);

    tb.enter()
        .append("line")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("x1", function(d) { return xscale(parseInt(d.data[d.ipr[0]])); })
        .attr("y1", function(d) { return yscale(d.y + 1); })
        .attr("x2", function(d) { return xscale(parseInt(d.data[d.ipr[1]])); })
        .attr("y2", function(d) { return yscale(d.y + 1); });

    tb.exit().remove();

    var t = xaxis.selectAll("line")
    .data(xLabels);

    t.enter()
        .append("line")
        .attr("stroke", "grey")
        .attr("stroke-dasharray", "5, 5")
        .attr("stroke-width", 0.75)
        .attr("x1", function(d) { return xscale(0); })
        .attr("y1", function(d) { return yscale(0.5); })
        .attr("x2", function(d) { return xscale(0); })
        .attr("y2", function(d) { return yscale(rdata.length + 1) + 20; });

    t.exit().remove();
}

function renderBubbleChart(data) {
    var i, y, j;
    var realdata = [];
    var graphics = [];
    var maxdomain = 10;
    var rangeto = 0;

    // extract the questions from the returned data
    for (i = 0; i < data.length; i++) {
        switch (data[i].typ) {
                case "multichoicerated":
                case "multichoice":
                    realdata.push(data[i]);
                    break;
                default:
                    break;
        }
    }

    // extract the axis labels

    // This ONLY works if all questions have the same values!
    // if we have different questions, then we MUST create multiple graphs
    var xLabels = realdata[0].answerValues.map(function (d, i) {
        return {
            xVal: i + 1,
            yVal: 0,
            text: Array.isArray(d) ? d[1] : d
        };
    });

    // the y labels are the questions. These can be pretty long
    var yLabels = extractQuestionLabels(realdata);

    // analyse the responses
    for (y = 0; y < realdata.length; y++) {
        var radius = [];
        var valueHash = {};
        var tmpRangeTo = parseInt(realdata[y].range_to);

        if (tmpRangeTo > rangeto) {
            rangeto = tmpRangeTo;
        }

        if (realdata[y].answers.length > maxdomain){
            maxdomain = realdata[y].answers.length;
        }

        for (j = 0; j < realdata[y].answerValues.length; j++) {
            radius.push(0);
            var radiusRating = realdata[y].answerValues[j][0];

            valueHash[radiusRating] = j;
        }

        for (i = 0; i < realdata[y].answers.length; i++) {
            var radiusValue = parseInt(realdata[y].answers[i]);

            if (radiusValue > 0 || radiusValue === 0) {
                var radiusIndex = valueHash[radiusValue];

                //console.log("val = " + radiusValue + "; id = " + radiusIndex + "; orig = " + realdata[y].answers[i]);

                radius[radiusIndex] += 1;
            }
        }

        for (i = 0; i < radius.length; i++) {
            graphics.push({
                rVal: radius[i],
                xVal: i + 1,
                yVal: y + 1
            });
        }
    }

    // create d3 scale projection functions
    var rscale = d3.scale.linear()
                   .domain([0, maxdomain])
                   .range([0, 30]);

    var xscale = d3.scale.linear()
                   .domain([0, rangeto + 1])
                   .range([0, 75 * (rangeto + 1)]);

    // reverse the y axis, so 0 is in the upper corner
    var yscale = d3.scale.linear()
                   .domain([realdata.length + 1, 0])
                   .range([realdata.length * 75, 0]);

    // add the y axis labels
    if (!$("#y-axis").length) {
        renderAxis(yLabels,
                   svgRoot.append("g")
                       .attr("id", "y-axis")
                       .attr("transform","translate(20," + 10 + ")"))
            .attr("text-anchor", "right")
            .attr("y", function (d) {
                return yscale(d.yVal);
            })
            .attr("dy", "0.3ex");
    }

    var bbox = d3.select("#y-axis").node().getBBox();
    var yaxisWidth = bbox.width;

    $("#feedback_analysis").height(Math.floor(bbox.height + 50));

    // add the x axis
    if (!$("#x-axis").length) {
        renderAxis(xLabels,
                   svgRoot.append("g")
                       .attr("id", "x-axis")
                       .attr("transform","translate( " + (yaxisWidth + 10) + ",15)"))
            .attr("text-anchor", "middle")
            .attr("x", function (d) {
                return xscale(d.xVal);
            });

        graph = svgRoot.append("g")
                          .attr("id", "datamatrix")
                          .attr("transform","translate(" + (yaxisWidth + 10) + "," + 10 + ")");
    }

    var t = graph.selectAll("circle")
                .data(graphics);
                 // attach the graph data

    t.enter().append("circle");
    t.attr("class", function (d) {
        return "blue";
    })
        .attr("r", function (d) {
            return rscale(d.rVal);
        })
        .attr("cx", function (d) {
            return xscale(d.xVal);
        })
        .attr("cy", function (d) {
            return yscale(d.yVal);
        });

    t.exit().remove();
}

function loadBarChart() {
    var urlcompleted = "/local/powertla/rest.php/content/survey/analysis/" + $.urlParam("id");

    // Split url to check path

    //Beginning d3 barchart part
    var margin = {top: 20, right: 20, bottom: 70, left: 40},
            width = 600 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;


    // set the ranges
    var x = d3.scale.ordinal().rangeRoundBands([0, width], 0.05);
    var y = d3.scale.linear().range([height, 0]);

    // define the axis
    var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom");


    var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient("left")
                  .ticks(4); // should not be hard coded

    var bbox = d3.select("#y-axis");

    $("#feedback_analysis").height(Math.floor(bbox.height)-600);


    // load the data
    d3.json(urlcompleted, function(error, data) {
        if (data) {
            data.forEach(function(d) {
                d.label = d.label;
                d.average_value = +d.average_value;
            });

            // scale the range of the data
            x.domain(data.map(function(d) { return d.label; }));
            y.domain([0, d3.max(data, function(d) { return d.average_value; })]);

            // add axis
            svgRoot.append("g")
                .attr("id","x-axis")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", "-.55em")
                .attr("transform", "rotate(-45)" );

            svgRoot.append("g")
                .attr("id","y-axis")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 3)
                .attr("dy", ".21em")
                .style("text-anchor", "end");

            // draw bar chart
            svgRoot.selectAll("bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function(d) {
                    return x(d.label);
                })
                .attr("width", x.rangeBand())
                .attr("y", function(d) {
                    return y(d.average_value);
                })
                .attr("height", function(d) {
                    return height - y(d.average_value);
                });

            // Now resize the content-box, so the chart is fully visible.
            // The technique used here uses the bounding box of the Axis-objects.

            // This works as following:
            // Because the Y-Axis is not the full height of the chart, we need
            // to take the height of the X-Axis also into account.
            var yAxisBox = d3.select("#y-axis").node().getBBox();
            var xAxisBox = d3.select("#x-axis").node().getBBox();

            // the chart height is the total height of the Y-Axis as well the
            // height of the X-Axis and its lables.
            // Because the X-Axis and its lables are within the same SVG Group,
            // we just need to consider the group's bounding box.
            var chartHeight = yAxisBox.height + xAxisBox.height;

            $("#feedback_analysis").height(Math.floor(chartHeight));
        }
        checkLiveUpdate(loadBarChart);
    });
}

function checkLiveUpdate(cbFunction) {
    if ($("#fbanalysis_liveupdate").hasClass("btn-warning")) {
        setTimeout(cbFunction, 3000);
    }
}

function toggleLiveUpdate() {
    $("#fbanalysis_liveupdate").toggleClass("btn-warning");
    $("#fbanalysis_liveupdate").toggleClass("btn-outline-warning");

    if ($("#fbanalysis_barchart").hasClass("btn-primary")) {
        checkLiveUpdate(loadBarChart);
    }
    else if ($("#fbanalysis_bubblechart").hasClass("btn-primary")) {
        checkLiveUpdate(loadBubbleChart);
    }
    else if ($("#fbanalysis_boxchart").hasClass("btn-primary")) {
        checkLiveUpdate(loadBoxChart);
    }
}

function clearSelection(tname) {
    if (tname !== "#fbanalysis_boxchart") {
        $("#fbanalysis_boxchart").removeClass("btn-primary");
        $("#fbanalysis_boxchart").addClass("btn-outline-primary");
    }
    if (tname !== "#fbanalysis_barchart") {
        $("#fbanalysis_barchart").removeClass("btn-primary");
        $("#fbanalysis_barchart").addClass("btn-outline-primary");
    }
    if (tname !== "#fbanalysis_bubblechart") {
        $("#fbanalysis_bubblechart").removeClass("btn-primary");
        $("#fbanalysis_bubblechart").addClass("btn-outline-primary");
    }
    initSVGRoot();
}

function toggleBoxChart() {
    $("#fbanalysis_boxchart").toggleClass("btn-primary");
    $("#fbanalysis_boxchart").toggleClass("btn-outline-primary");

    clearSelection("#fbanalysis_boxchart");
    showChart("#fbanalysis_boxchart");
    loadBoxChart();
}

function toggleBarChart() {
    $("#fbanalysis_barchart").toggleClass("btn-primary");
    $("#fbanalysis_barchart").toggleClass("btn-outline-primary");
    clearSelection("#fbanalysis_barchart");
    showChart("#fbanalysis_barchart");
    loadBarChart();
}

function toggleBubbleChart() {
    $("#fbanalysis_bubblechart").toggleClass("btn-primary");
    $("#fbanalysis_bubblechart").toggleClass("btn-outline-primary");
    clearSelection("#fbanalysis_bubblechart");
    showChart("#fbanalysis_bubblechart");
    loadBubbleChart();
}

function extendUI() {
    // insert our ui before the feedback_info
    // The chart area is hidden by default
    $(".feedback_info:first-child").before("<div id=\"feedback_analysis\" class=\"hidden\">");

    // Insert the functional buttons. These buttons are always visible.
    $("#feedback_analysis").before("<div id=\"feedback_vizbuttons\" class=\"fbbuttons\">");
    $("#feedback_vizbuttons")
        .append("<span id=\"fbanalysis_barchart\" class=\"btn btn-outline-primary\">Bar Chart</span>")
        .append("<span id=\"fbanalysis_bubblechart\" class=\"btn btn-outline-primary\">Bubble Chart</span>")
        .append("<span id=\"fbanalysis_boxchart\" class=\"btn btn-outline-primary\">Box Chart</span>")
        // The live update should be deactivated in no chart is visible.
        .append("<span id=\"fbanalysis_liveupdate\" class=\"btn btn-outline-warning\">Live Update (beta)</span>");

    $("#fbanalysis_barchart").click(toggleBarChart);
    $("#fbanalysis_boxchart").click(toggleBoxChart);
    $("#fbanalysis_bubblechart").click(toggleBubbleChart);
    $("#fbanalysis_liveupdate").click(toggleLiveUpdate);
}

// this shows or hides the SVG, depending on the activation state of the control button.
function showChart(chart) {
    if ($(chart).hasClass("btn-primary")) {
        $("#feedback_analysis").removeClass("hidden");
    }
    else {
        $("#feedback_analysis").addClass("hidden");
    }
}

function checkFeedbackAnalysis() {
    var pathArray = window.location.pathname.split("/");

    var functionName = pathArray.pop(); // should be last element
    var moduleName   = pathArray.pop(); // should be last element
    // console.log(secondLevelPath);
    //check analysis.php page is true

    if (moduleName === "feedback" && functionName === "analysis.php") {
        extendUI();
        // toggleBarChart();
    }
}
// console.log("läuft");
// $(document).ready(checkFeedbackAnalysis);
exports.checkFeedbackAnalysis = checkFeedbackAnalysis;
});
