define(["jquery", 'theme_htwboost/d3', "exports"], function($, d3, exports) {
    var type = ["multichoicerated", "multichoice", "numeric"];
    var xval, ylab;
    var xmin = 0, xmax = 0;

    function handleData(data) {
        if (data) {
            var extents = [];
            ylab = [];
            xval = [];
            data.map(function(question) {
                if (type.indexOf(question.typ) >= 0) {
                    ylab.push(question.label);

                    var bwData = {
                        y: question.label,
                        text: question.question,
                        median: d3.median(question.answers),
                        q1: d3.quantile(question.answers, 0.25),
                        q3: d3.quantile(question.answers, 0.75),
                        ipr: ipr(1.5, question.answers),
                        data: question.answers
                    };

                    if (isNaN(bwData.q3)) {
                        bwData.q3 = bwData.median;
                    }
                    if (isNaN(bwData.q1)) {
                        bwData.q1 = bwData.median;
                    }
                    if (bwData.q1 === bwData.q3) {
                        bwData.q1 = bwData.q1 - 1;
                    }

                    xval.push(bwData);
                    extents = extents.concat(d3.extent(question.answers));
                }
            });
            xmin = d3.min(extents) - 5;
            xmax = d3.max(extents) + 5;
         }
     }

     function setFraming(svg) {
         var yAxisBox = svg.node().getBBox();
         var chartHeight = yAxisBox.height + 10;

         $("#feedback_analysis").height(Math.floor(chartHeight));
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

     function renderChart(svg, data) {
         handleData(data);
         svg.selectAll("*").remove();

         var height = 50 * ylab.length;
         var width =  $("#feedback_analysis").width() - 50;

         var y = d3.scaleBand()
                   .range([0, height])
                   .domain(ylab);
                  // .padding(0.1);
         var x = d3.scaleLinear()
                   .range([0, width])
                   .domain(xmin, xmax);

        var gr = svg.append("g")
                    .attr("transform", "translate(50,50)");

        // Render the box
        var bw = y.bandwidth();
        var bw2 = bw/2;

        gr.selectAll("rect")
          .data(xval)
          .enter()
          .append("rect")
          .attr("y", function(d) { return y(d.y) - bw2; })
          .attr("height", bw)
          .attr("x", function(d) { return x(d.q1); })
          .attr("width", function(d) { return x(d.q3) - x(d.q1); });

        // TODO render the median

        // TODO render the whiskers

        gr.append("g")
            .attr("id", "x-axis")
            //.attr("transform", "translate(0,0)")
            .call(d3.axisTop(x));

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
