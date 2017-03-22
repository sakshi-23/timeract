$(function() {
    // Dimensions of the visualization
    var predDate;
    var time = 1;
    var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };
    var parseDate = d3.time.format("%Y%m%d").parse;
    var color = d3.scale.category10();
    $.urlParam = function(name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results==null){
           return null;
        }
        else{
           return results[1] || 0;
        }
        }

    $("#organization0").val($.urlParam('SYM'));

    // Load up the data
    var dataOriginal = [],
        focus = [],
        focus2 = [],
        rectangle = [],
        boundaries = [];
    
    var weight = 2,
        r_index = 0,
        r_indexprev=0;


    function loadData(start, end, weight) {
        setValues(); //from the input boxes

        $.ajax({
            type: 'GET',
            url: '/data/get-info',
            data: {
                "start": start,
                "end": end,
                "start_date": start_date,
                "end_date": end_date,
                "symbol": company,
                "prediction_period": prediction_period
            },
        }).done(function(data, textStatus, jqXHR) {
            data = JSON.parse(data);
            predDate = data.values.length - prediction_period;
            dataOriginal[r_index]={}
            dataOriginal[r_index].datapoints = data.values;
            dataOriginal[r_index].weight = weight;
            dataOriginal[r_index].start = start;
            dataOriginal[r_index].end = end;
            dataOriginal[r_index].selected = data.points;

            processData(r_index);

        }).fail(function(data) {
            console.log("Something went wrong..");
        });
    }





    function processData(current_index) {
    	
        var selected = [];
        var totalWeight = 0;
        var data = JSON.parse(JSON.stringify(dataOriginal[current_index].datapoints));
        var i, k;
        var index = 0;

        for (k = 0; k < dataOriginal.length; k++) {
            totalWeight = totalWeight + dataOriginal[k].weight;
        }


        for (k = 0; k < dataOriginal.length; k++) {
            var tempWeight = dataOriginal[k].weight;
            for (i = 0; i < Math.round((tempWeight / totalWeight) * 3); i++) {
                selected[index] = dataOriginal[k].selected[i] + dataOriginal[k].start;
                index++;
            }
        }

        data[0].selected = selected;

        for (i = (predDate + 1); i < dataOriginal[current_index].datapoints.length; i++) {
            var dataTemp = 0;
            var dataTemp2 = 0;
            for (k = 0; k < dataOriginal.length; k++) {
                dataTemp += dataOriginal[k].datapoints[i].predictedprices * dataOriginal[k].weight;
                dataTemp2 += dataOriginal[k].datapoints[i].predictedprices2 * dataOriginal[k].weight;
            }
            data[i].predictedprices = dataTemp / totalWeight;
            data[i].predictedprices2 = dataTemp2 / totalWeight;

        }
        recreateData = {
            "data": JSON.parse(JSON.stringify(data)),
            "weight": dataOriginal[current_index].weight,
            "index": current_index
        };
        createChart(data, dataOriginal[current_index].weight, current_index);
    }



    function createChart(data, weight, current_index) {
    	
    	$(".user-interaction").prop("click", null);
    	
        var tickCount = parseInt((predDate / prediction_period) * 10);
        var maxticks = parseInt((predDate*10)/width);
        var maxticksPred=1;
        if(widthpredicted<300){
        	maxticksPred=parseInt(600/widthpredicted);
        }
        
        var xAxis = d3.svg.axis().scale(x).orient("bottom").innerTickSize(-height).ticks(tickCount);
        var xAxispredicted = d3.svg.axis().scale(xpredicted).orient("bottom").innerTickSize(-height).ticks(10);

        var addRegionFlag = false,
            addPredictionLine = false;
        var postionLine = 0;
        var startRegion;


        d3.selectAll("svg").remove();
        $(".control-panel").html("");
        var svg = d3.select(".timeseries-chart")
            .append("svg")
            .attr("width", width + 100)
            .attr("height", height + margin.top)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + 0 + ")");



        var svgpredicted = d3.select(".timeseries-chart")
            .append("svg")
            .attr("width", widthpredicted + 100)
            .attr("height", height + margin.top)
            .attr("class", "predicted-svg")
            .style("left", (width + 50) + "px")
            .append("g");

        color.domain(d3.keys(data[predDate + 1]).filter(function(key) {
            return key.indexOf("predictedprices") != -1;
        }));

        data.forEach(function(d) {
            d.date = parseDate(d.date);
        });
        getNews(company, data[predDate].date)
        
        var timesSeriesData = [{
            "name": "prices",
            "values": data.slice(0, predDate).map(function(d) {
                return {
                    date: d.date,
                    price: +d.prices
                };
            })
        }];

        var predictedSeriesData = color.domain().map(function(name) {
            return {
                name: name,
                values: data.slice(predDate-1).map(function(d) {
                    if (d[name] !== undefined && d[name] !== null)
                        return {
                            date: d.date,
                            price: +d[name]
                        };
                })
            };
        });

        // Select all timesSeriesData
        var stock = svg.selectAll(".stock")
            .data(timesSeriesData)
            .enter().append("g")
            .attr("class", "stock");

        // Set the x and y domains
        x.domain(d3.extent(timesSeriesData[0].values, function(d) {
            return d.date;
        }));
        y.domain([
            d3.min(timesSeriesData, function(c) {
                return d3.min(c.values, function(v) {
                    return v.price - 20;
                });
            }),
            d3.max(timesSeriesData, function(c) {
                return d3.max(c.values, function(v) {
                    return v.price + 20;
                });
            })
        ]);



        // Select all timesSeriesData
        var stockpredicted = svgpredicted.selectAll(".stockpredicted")
            .data(predictedSeriesData)
            .enter().append("g")
            .attr("class", "stockpredicted");

        // Set the x and y domains
        xpredicted.domain(d3.extent(predictedSeriesData[0].values, function(d) {
            return d.date;
        }));


        // Set the caption for the y-axis
        svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em");
        svg.append("g").attr("class", "x axis x-axis x-axis-data").attr("transform", "translate(0," + (height) + ")").call(xAxis);

        svgpredicted.append("g").attr("class", "x axis x-axis x-axis-predicted").attr("transform", "translate(0," + (height) + ")").call(xAxispredicted);

        svg.selectAll(".x-axis-data text").attr("class", function(d, i) {
            if (i % maxticks !== 0) {
                return "hidden"
            }
        });
        
        svgpredicted.selectAll(".x-axis-predicted text").attr("class", function(d, i) {
            if (i % maxticksPred !== 0) {
                return "hidden"
            }
        });


        if (time == 1) {
            addRegion(1)
            time++
        }
        showSpecifiedRegions()
        appendSelected()




        // Create the line chart using the custom path generator
        stock.append("path")
            .attr("class", "line")
            .attr("d", mkPath)
            .style("stroke", "#607D8B")

        stockpredicted.append("path")
            .attr("class", "line")
            .attr("d", mkPath)
            .style("stroke", function(d) {
                return color(d.name);
            })
        
       
		  

        var predictionChangeText= svgpredicted.append("text")
        			.attr("class", "predictionChange")
        			.attr("transform", "translate(" + widthpredicted + "," + height/2 + ")")
        			.style("display","none")
        			
		predictionChangeText.append("tspan")
					.attr("class", "predValue")
					.attr("dy",5)
					.attr("x",0)
        predictionChangeText.append("tspan")
        			.attr("class", "predPercent")
        			.attr("dy",10)
        			.attr("x",0)

        var bisectDate = d3.bisector(function(d) {
            return d.date;
        }).left; // **

        // **********
        // append the rectangle to capture mouse  
        svg.append("rect")
            .attr("width", width) // **********
            .attr("height", height) // **********
            .style("fill", "none") // **********
            .style("pointer-events", "all")
            .on("mousemove", mouseMoveActions)
            .on("click", specifyPosition)
            .style("opacity", 0) // **********

        svgpredicted.append("rect")
            .attr("width", widthpredicted) // **********
            .attr("height", height) // **********
            .style("fill", "none") // **********
            .style("pointer-events", "all")
            .on("mousemove", mouseMovePredictionActions)
            .on("click",stopPred)
            .style("opacity", 0) // **********


        
            $("#addRegion").unbind('click').click(addRegion);
            $("#addPrediction").on("click", addPred);

        function mouseMovePredictionActions() {
            if (addPredictionLine) {
                var y0 = d3.mouse(this)[1]
                var newPrice=y.invert(y0)
                var predchange=(newPrice-predictedSeriesData[0].values[0].price).toFixed(2)
                predchangepercent=((predchange/predictedSeriesData[0].values[0].price)*100).toFixed(2)
                predLine.attr("y2", y0)
                predictionChangeText.select(".predValue").text("Change:"+predchange );
                predictionChangeText.select(".predPercent").text("Percent"+predchangepercent+"%" );
                return;
            }

        }
    	var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("a simple tooltip");
    	
   svgpredicted.selectAll("dot")
  	    .data(predictedSeriesData[0].values)
  	    .enter().append("circle")
  	    .attr("r",1.5)
  	    .style("fill", "steelblue")
  	    .attr("transform",function(d){
  	    	return "translate(" + xpredicted(d.date) + "," + y(d.price) + ")"})
  	    .on("mouseover", function(){return tooltip.style("visibility", "visible");})
		.on("mousemove", function(d){return tooltip.text(d.price).style("top",
		    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
		.on("mouseout", function(){return tooltip.style("visibility", "hidden");});
   
	svgpredicted.selectAll("dot")
  	    .data(predictedSeriesData[1].values)
  	    .enter().append("circle")
  	    .attr("r",1.5)
  	    .style("fill", "rgb(255, 127, 14)")
  	    .attr("transform",function(d){
  	    	return "translate(" + xpredicted(d.date) + "," + y(d.price) + ")"})
  	    .on("mouseover", function(){return tooltip.style("visibility", "visible");})
		.on("mousemove", function(d){return tooltip.text(d.price).style("top",
		    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
		.on("mouseout", function(){return tooltip.style("visibility", "hidden");});
		  	

	
	
	
  	    	


        function addPred() {
            addPredictionLine = true;
            predictionChangeText.style("display","");
            
            $(".userPrediction").remove()
            
            predLine = svgpredicted.insert("g")
            	.attr("class","userPrediction")
                .append("line") // attach a line
                .style("stroke", "red")
                .style("stroke-width", "5")
                .attr("x1", xpredicted(predictedSeriesData[0].values[0].date)) // x position of the first end of the line
                .attr("y1", y(predictedSeriesData[0].values[0].price)) // y position of the first end of the line
                .attr("x2", widthpredicted) // x position of the second end of the line
                .attr("y2", y(predictedSeriesData[0].values[0].price))
                .attr("opacity", 1)
                .attr("class", "predLine")
                .on("click", stopPred);

        }
        
        

        function stopPred() {
        	if(!addPredictionLine)
        		return;
        	
        	 $.ajax({
                 type: 'GET',
                 url: 'data/get-closest/'+predchangepercent,
             }).done(function(result, textStatus, jqXHR) {
                 console.log(result)
                 result=JSON.parse(result);
	            for (var i = 0; i < result.indices.length; i++) {
	                var d =data[result.indices[i]];
	                var dnext =data[result.indices[i]+parseInt(prediction_period)];
	                var predPoints = svg.append("g")
	                	.attr("transform", "translate(" + x(d.date) + "," + y(d.prices) + ")")
	                    .attr("class","userPrediction")
	                    
	                    predPoints.append("circle")
	                    .attr("r", 3)
	                    predPoints.append("text")
	                    .attr("dy",(i%2)-1+"em")
	                    .text(result.values[i]+"%");
	                
	                	svg.append("line")
	                	.attr("class","userPrediction")
	                	.attr("x1",x(d.date))
	                	.attr("y1",y(d.prices))
	                	.attr("x2",x(dnext.date))
	                	.attr("y2",y(dnext.prices?dnext.prices:data[predDate-1].prices))
	                	.style("stroke", "black")
	            }

             }).fail(function(data) {
                 console.log("Something went wrong..");
             });
            addPredictionLine = false;
        }

        function addRegion(time) {
            var end;
            if (time == 1) {
                end = predDate;
                boundaries[0] = [0, end];
            } else {
                addRegionFlag = true;
                postionLine = 0;
                r_index++;
                end = 0;
            }

            focus[r_index] = svg.insert("g");
            focus2[r_index] = svg.insert("g");

            focus[r_index].append("line") // attach a line
                .style("stroke", "black")
                .attr("pos", 0)
                .attr("x1", 0) // x position of the first end of the line
                .attr("y1", 0) // y position of the first end of the line
                .attr("x2", 0) // x position of the second end of the line
                .attr("y2", height)
                .attr("opacity", 0.2);

            focus2[r_index].append("line") // attach a line
                .style("stroke", "black")
                .attr("pos", end)
                .attr("x1", mousePos2(end)[0]) // x position of the first end of the line
                .attr("y1", 0) // y position of the first end of the line
                .attr("x2", mousePos2(end)[0]) // x position of the second end of the line
                .attr("y2", height)
                .attr("opacity", 0.2);

            rectangle[r_index] = svg.insert("rect", ["rect"])
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", mousePos2(end)[0])
                .attr("height", height)
                .attr("fill", "gray")
                .attr("opacity", 0.2);

        }


        var hoverText = svg.append("g")
            .attr("class", "hoverText");

        hoverText.append("circle")
            .attr("r", 4.5)
            .attr("fill","green")
            .attr("transform", "translate(" + 100 + "," + 0 + ")");

        hoverText.append("text")
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("dx", "-.35em");

        var clickText = svg.append("g")
            .attr("class", "clickText")
            .style("display", "none");

        clickText.append("circle")
            .attr("r", 6.5)
            .style("fill", "green");

        clickText.append("text")
            .attr("x", 9)
            .attr("dy", ".35em");

        // **********
        
        function specifyPosition() {
            if (!addRegionFlag) {
                var x0 = x.invert(d3.mouse(this)[0]), // **********
                    i = bisectDate(data, x0, 1) // **********
                var pos = mousePos2(i)
                clickText.attr("transform", "translate(" + pos[0] + "," + pos[1] + ")");
                if (i < predDate) {
                    price = pos[2].prices.toFixed(2)
                } else {
                    price = pos[2].predictedprices.toFixed(2)
                }
                clickText.select("text").text(d3.time.format("%d-%b-%y")(pos[2].date) + " , $" + price);
                clickText.style("display", "")
                getNews(company, pos[2].date);
                return;
            }
            postionLine++;
            addRegionFlag = addRegionFlag && (postionLine <= 1);
            if (!addRegionFlag){
            	$("#process").trigger("click");
            }
        }

        function mouseMoveActions() {
            if (!addRegionFlag) {
                hoverText.style("display", "");
                var x0 = x.invert(d3.mouse(this)[0]), 
                    i = bisectDate(data, x0, 1) // **********
                var pos = mousePos2(i);
                hoverText.attr("transform", "translate(" + (pos[0] - 100) + "," + pos[1] + ")");
                if (i < predDate) {
                    price = pos[2].prices.toFixed(2)
                } else {
                    price = pos[2].predictedprices.toFixed(2)
                }
                hoverText.select("text").text(d3.time.format("%d-%b-%y")(pos[2].date) + " , $" + price);
            } else {
                hoverText.style("display", "none");
                var x0 = x.invert(d3.mouse(this)[0]), // **********
                    i = bisectDate(data, x0, 1) // **********
                var pos = mousePos(i+5)
                if (addRegionFlag) {
                    if (postionLine == 1) {
                        var s = Math.min(startRegion, pos[0]);
                        var dif = Math.abs(pos[0] - startRegion);

                        focus2[r_index].select("line") // **********
                            .attr("x1", pos[0])
                            .attr("x2", pos[0])
                            .attr("pos", i);

                        rectangle[r_index]
                            .attr("x", s)
                            .attr("width", dif);

                        boundaries[r_index][postionLine] = i;

                    } else {
                        focus[r_index].select("line") // **********
                            .attr("x1", pos[0])
                            .attr("x2", pos[0])
                            .attr("pos", i)

                        startRegion = pos[0];
                        boundaries[r_index] = [i, 0];
                    }

                }
            }

        }


        function showSpecifiedRegions() {
            for (var i in rectangle) {
                var pos0 = mousePos2(parseInt(focus[i].select("line").attr("pos")))[0];
                var pos1 = mousePos2(parseInt(focus2[i].select("line").attr("pos")))[0];
                var s = Math.min(pos0, pos0);
                var dif = Math.abs(pos0 - pos1);

                focus[i].select("line").attr("x1", pos0)
                    .attr("x2", pos0);

                focus2[i].select("line").attr("x1", pos1)
                    .attr("x2", pos1);

                d3.select("g").node().appendChild(focus2[i].node());
                d3.select("g").node().appendChild(focus[i].node());

                rectangle[i].attr("x", s)
                    .attr("width", dif);
                    
                 $(".control-panel").append('<div class="controls" id="control' + i + '"><button class="decrease">-</button><button class="increase">+</button></div>');
                  
                 $("#control" + i).css({"margin-left": s + dif / 2 })
                 
                if (i == current_index) {
                    rectangle[i].attr("opacity", 0.1 * weight);
                }
                
                 d3.select("g").node().appendChild(rectangle[i].node());

            }

        }

        function appendSelected() {
            for (var i = 0; i < data[0]["selected"].length; i++) {
                d = data[data[0]["selected"][i]];
                var circle = svg.append("g")
                    .attr("class", "focus");
                
                circle.append("circle")
                      .attr("r", 3)
                      .attr("transform", "translate(" + x(d.date) + "," + y(d.prices) + ")");
            }
        }



        function mousePos(i, x0) {
            x0 = x0 || 1000;
            if (i > (predDate + 1))
                d = data[predDate + 1]
            else // **********
                d = data[i]
            return [x(d.date), y(d.prices), d];
        }

        function mousePos2(i) {
            d = data[i]
            if (i > predDate) {
                return [x(d.date), y(d.predictedprices), d];
            }
            return [x(d.date), y(d.prices), d];
        }

        function mkPath(d) {
            var predictDate = data[predDate].date;
            var prev = -1;
            var lastDate = null;
            var s = "";

            // Go through all the values that we have
            for (var i = 0; i < d.values.length; i++) {
                // If the date is beyond our threshold then we want a dashed line
                if (d.name.indexOf('predictedprices') != -1 ) {
                	if (prev == -1) {
                		 s = s + "M";
                		 s = s + " " + xpredicted(d.values[i].date) + " " + y(d.values[i].price);
                		 prev+1;
                	}
                	else{
                    	 var xp = d3.scale.linear().range([d.values[i - 1].date, d.values[i].date]);
                         var yp = d3.scale.linear().range([d.values[i - 1].price, d.values[i].price]);
                         for (var j = 0.1; j < 1; j = j + 0.2) {
	                        s = s + "M" + xpredicted(xp(j)) + " " + y(yp(j));
	                        s = s + " " + xpredicted(xp(j + 0.1)) + " " + y(yp(j + 0.1));
                        }
                    }
                } else {
                    // Just create a normal path
                    if (prev == -1) {
                        s = s + "M";
                    }
                    s = s + " " + x(d.values[i].date) + " " + y(d.values[i].price);
                }

                prev = d.values[i].date;
            }
            return s;
        }


    }


    $("#process").on("click", function() {
        if (r_index!=r_indexprev) {
            var i_prev = boundaries[r_index][0]
            var i_next = boundaries[r_index][1]
            if (i_prev > i_next) {
                temp = i_prev
                i_prev = i_next
                i_next = temp
            }
            weight = 2;
            loadData(i_prev, i_next, 2);
            r_indexprev=r_index
            
        } else {
        	time=1
        	dataOriginal = [],
             focus = [],
             focus2 = [],
             rectangle = [],
             boundaries = [];
             r_index = 0,
             r_indexprev=0;
             loadData(0, 0, 3);
        }

    });

    $("body").on("click", ".increase", function() {

        var ind = $(this).parent().attr("id").slice(-1)
        var weight = dataOriginal[ind].weight;
        if (weight >= 5)
            return;
        dataOriginal[ind].weight += 1
        processData(ind);
    })

    $("body").on("click", ".decrease", function() {
        var ind = $(this).parent().attr("id").slice(-1)
        var weight = dataOriginal[ind].weight;
        if (weight <= 0)
            return;
        dataOriginal[ind].weight -= 1
        processData(ind);
    });
    setChartSize(1000)
    loadData(0, 0, 3);
   
    $("#slider").slider({
        value: 85
    });
    var startPos = 85
    $("#slider").on("slidestop", function(event, ui) {
        endPos = ui.value;

        if (startPos != endPos) {
            resizeChart((endPos / 100) * 1200)
        }

        startPos = endPos;
    });
    
    

    function setChartSize(w) {
        width = w - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;
        widthpredicted = 1200 - w-  margin.left - margin.right
            // Format for parsing dates				
            // Determine the scales and render the axis
        x = d3.time.scale().range([0, width]);
        y = d3.scale.linear().range([height, 0]);
        yAxis = d3.svg.axis().scale(y).orient("left");
        // Great the SVG element
        xpredicted = d3.time.scale().range([0, widthpredicted]);
    	}

    function resizeChart(width) {
        setChartSize(width)
        createChart(JSON.parse(JSON.stringify(recreateData.data)), recreateData.weight, recreateData.index)
    }


    function setValues() {
        prediction_period = $("input[name='predictionPeriod']").val();
        start_date = $("input[name='startDate']").val();
        end_date = $("input[name='endDate']").val();
        company = $("input[name='organization']").val()

    }


});



var map={"IBM":"IBM","AAPL":"Apple Inc","GOOG":"Google"}


function getNews(q, date) {
	q=map[q];
    var days = 2;
    var start = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
    var end = new Date(date.getTime() + (days * 24 * 60 * 60 * 1000));
    start = d3.time.format("%Y%m%d")(start)
    end = d3.time.format("%Y%m%d")(end)

    var selectedDate = d3.time.format("%d-%b-%y")(date)
        	$.ajax({
        	    url : 'http://api.nytimes.com/svc/search/v2/articlesearch.json?',
        	    type : 'GET',
        	    data : {
        	        'q' : q,
        	        'facet_field':'section_name',
        	        'begin_date':start,
        	        'end_date':end,
        	        'api-key':'1f86faded8d55105c9156394dae8cc5d:8:74713945'
        	    },
        	    dataType:'json',
        	    success : function(data) {              
        	        docs=data.response.docs;
        	        var news="<div class='date'>News : "+selectedDate+"</div>"
        	        for (i in docs){
        	        	if(docs[i]['abstract']!=null){
        	        		var abs=docs[i]['abstract'];
        	        	}
        	        	else{
        	        		var abs=docs[i]['lead_paragraph']
        	        	}
        	        	var head=docs[i]['headline'].main
        	        	var url=docs[i]['web_url'];
        	        	news+="<div class='abs'><strong>"+head+"</strong>: "+abs+"<a href='"+url+"'>URL</a></div>"
        	        	
        	        }
        	        $("#news").html(news)
        	    },
        	    error : function(request,error)
        	    {
        	    }
        	});
    
    $("#addOrg").on("click",function(){
    	$(".second").show()
    });

}

