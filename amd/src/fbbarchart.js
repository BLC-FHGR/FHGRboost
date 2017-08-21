define(["jquery", 'theme_htwboost/d3', "exports"], function($, d3, exports) {
    var type = ["multichoicerated"];

    var xlab = [];
    var ylab = [];
    var xval = [];

   function handleData(data) {
       if (data) {
           ylab = [];
           xlab = [];
           xval = [];
            data.map(function(question) {
                if (type.indexOf(question.typ) >= 0) {
                    ylab = question.answerValues.map(function (arr) {
                        return arr[0];
                    });

                    var min = d3.min(ylab) - 1;
                    xlab.push(question.label);
                    xval.push({x: question.label, y: d3.mean(question.answers) || min});
                }
            });
        }
    }

    function setFraming(svg) {
        var yAxisBox = svg.node().getBBox();
        var chartHeight = yAxisBox.height + 10;

        $("#feedback_analysis").height(Math.floor(chartHeight));
    }

    function renderChart(svg, data) {
        handleData(data);

        svg.selectAll("*").remove();

        var height = 500;
        var width =  $("#feedback_analysis").width() - 50;

        var x = d3.scaleBand()
                  .range([0, width])
                  .padding(0.1);
        var y = d3.scaleLinear()
                  .range([height, 0]);

        x.domain(xlab);
        y.domain([d3.min(ylab) - 1, d3.max(ylab)]);

        var gr = svg.append("g")
           .attr("transform",
                 "translate(50,10)");

         gr.selectAll(".bar")
           .data(xval)
           .enter()
           .append("rect")
           .attr("class", "bar")
           .attr("x", function(d) { return x(d.x); })
           .attr("width", x.bandwidth())
           .attr("y", function(d) { return y(d.y); })
           .attr("height", function(d) { return height - y(d.y); });

          // add the x Axis
          gr.append("g")
              .attr("id", "x-axis")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(x));

          // add the y Axis
          gr.append("g")
              .attr("id", "y-axis")
              .call(d3.axisLeft(y).ticks(ylab.length));

          setFraming(svg);
    }

    function chartFactory(svg) {
        return function (data) {
            renderChart(svg, data);
        };
    }

    exports.renderChart = chartFactory;
});
