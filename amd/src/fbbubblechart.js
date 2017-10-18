define(["jquery", 'theme_htwboost/d3', "exports"], function($, d3, exports) {
    var type = ["multichoicerated", "multichoice"];

    var xlab = [];
    var ylab = [];
    var xval = [];

var toppadding = 150;

   function handleData(data) {
       if (data) {
           ylab = [];
           xlab = [];
           xval = [];

           rmax = 0;

           data.map(function(question) {
                if (type.indexOf(question.typ) >= 0) {
                    var tmpCounter = {};
                    xlab = question.answerValues.map(function (arr) {
                        tmpCounter[arr[0]] = 0;
                        return arr[0];
                    });

                    question.answers.map(function(answer) {
                        tmpCounter[answer] += 1;
                    });

                    ylab.push(question.label);

                    question.answerValues.map(function(arr) {
                        xval.push({
                            y: question.label,
                            x: arr[0],
                            r: tmpCounter[arr[0]]
                        });

                        rmax = rmax > tmpCounter[arr[0]] ? rmax : tmpCounter[arr[0]];
                    });
                }
           });
        }
    }

    function setFraming(svg) {
        var yAxisBox = svg.node().getBBox();
        var chartHeight = yAxisBox.height + toppadding;

        $("#feedback_analysis").height(Math.floor(chartHeight));
    }

    function renderChart(svg, data) {
        handleData(data);

        svg.selectAll("*").remove();

        var height = 50 * ylab.length;
        var width =  $("#feedback_analysis").width() - toppadding;

        var y = d3.scaleBand()
                  .range([0, height]);
                 // .padding(0.1);
        var x = d3.scaleLinear()
                  .range([0, width]);
        var r = d3.scaleLinear()
                .range([0, height/(2*ylab.length)]);

        r.domain([0, rmax]);
        y.domain(ylab);
        x.domain([d3.min(xlab) - 1, d3.max(xlab)]);

        // add the bubble grid
        var gr = svg.append("g")
                    .attr("transform", "translate(50,50)");

        gr.selectAll(".circle")
          .data(xval)
          .enter()
          .append("circle")
          .attr("class", "fb-circle")
          .attr("cx", function(d) { return x(d.x); })
          .attr("cy", function(d) { return y(d.y) + y.bandwidth()/2; })
          .attr("r",  function(d) { return r(d.r); })
          .exit()
          .remove();

        // add the x Axis
        gr.append("g")
            .attr("id", "x-axis")
            //.attr("transform", "translate(0,0)")
            .call(d3.axisTop(x).ticks(xlab.length));

        // add the y Axis
        gr.append("g")
            .attr("id", "y-axis")
            .call(d3.axisLeft(y));

        setFraming(svg);
    }

    function chartFactory(svg) {
        return function (data) {
            renderChart(svg, data);
        };
    }

    exports.renderChart = chartFactory;
});
