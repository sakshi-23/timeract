$(function() {
    
	var map = {"AAPL":"Apple Inc.","ABBV":"AbbVie Inc.","ABT":"Abbott Laboratories","AMZN":"Amazon.com","AXP":"American Express Inc.","BA":"Boeing Co.","BAC":"Bank of America Corp","BIIB":"Biogen Idec","BK":"The Bank of New York Mellon","BLK":"BlackRock Inc","BMY":"Bristol-Myers Squibb","BRK.B":"Berkshire Hathaway","DIS":"The Walt Disney Company","DOW":"Dow Chemical","DUK":"Duke Energy","EMR":"Emerson Electric Co.","EXC":"Exelon","F":"Ford Motor","FB":"Facebook","FDX":"FedEx","FOX":"21st Century Fox","FOXA":"21st Century Fox","GD":"General Dynamics","GE":"General Electric Co.","GILD":"Gilead Sciences","GM":"General Motors","GOOG":"GOOGLE","GOOGL":"GOOGLE","GS":"Goldman Sachs","HAL":"Halliburton","HD":"Home Depot","HON":"Honeywell","IBM":"IBM","INTC":"Intel Corporation","JNJ":"Johnson & Johnson Inc","JPM":"JP Morgan Chase","KHC":"Kraft Heinz","KMI":"Kinder Morgan Inc","KO":"The Coca-Cola Company","NKE":"Nike","ORCL":"Oracle Corporation","OXY":"Occidental Petroleum Corp.","PCLN":"Priceline Group Inc","PEP":"Pepsico Inc.","V":"Visa Inc.","VZ":"Verizon Communications Inc","WBA":"Walgreens Boots Alliance","WFC":"Wells Fargo","WMT":"Wal-Mart","XOM":"Exxon Mobil Corp"}

    var predDate,prediction_period,start_date,end_date;
    var time = 1;
    var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };
    var startPos = 85
    var parseDate = d3.time.format("%Y%m%d").parse;
    var color = d3.scale.category10();
    var recreateData=[],allData=[];
    var height=400 - margin.top - margin.bottom;
    var timer;

    $.urlParam = function(name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results==null){
           return null;
        }
        else{
           return results[1] || 0;
        }
        }
    $("input[name='organization0']").val($.urlParam('SYM'));
    

    function addNewChart(index){
    	var index=allData.length;
    	var company=$("input[name='organization"+index+"']").val();
        allData.push({"dataOriginal":[],"focus1":[],"focus2":[],"rectangle" : [],
                "boundaries" : [],"r_index":0,"r_indexprev":0,"company":company})
        $("#regionControl").append('<button id="addPrediction'+index+'" class="user-interaction">Check Prediction</button><button id="addRegion'+index+'" class="user-interaction">Add Region</button>')
        $("#allCharts").append('<div class="timeseries-chart" id="timeSeriesChart'+index+'"></div><div class="control-panel" id="controlPanel'+index+'"></div><div class="slider" id="slider'+index+'"></div>')
       
        $("#slider"+index).slider({
        	value: 85
        });
    
        setChartSize($(window).width()-200,index);
        loadData(0, 0, 3,index,1);
    }
    

    function setChartSize(w,index) {
    	if(w>0){
    		allData[index].width = w - margin.left - margin.right,
        	allData[index].widthpredicted = $(window).width() - w -  margin.left - margin.right;
    	}
    	
    	allData[index].x = d3.time.scale().range([0, allData[index].width]),
    	allData[index].y = d3.scale.linear().range([height, 0]),
        allData[index].yAxis = d3.svg.axis().scale(allData[index].y).orient("left");
    	allData[index].xpredicted = d3.time.scale().range([0, allData[index].widthpredicted]);
    	
    	}
    

    function loadData(start, end, weight,chIdx,time) {
    	if (!chIdx)
    		chIdx=0
        setValues(chIdx); //from the input boxes
        company=allData[chIdx].company
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
        	var r_index=allData[chIdx].r_index;
            data = JSON.parse(data);
            predDate = data.values.length - prediction_period;
            allData[chIdx].dataOriginal[r_index]={}
            allData[chIdx].dataOriginal[r_index].datapoints = data.values;
            allData[chIdx].dataOriginal[r_index].weight = weight;
            allData[chIdx].dataOriginal[r_index].start = start;
            allData[chIdx].dataOriginal[r_index].end = end;
            allData[chIdx].dataOriginal[r_index].selected = data.points;

            processData(r_index,chIdx,time);

        }).fail(function(data) {
            console.log("Something went wrong..");
        });
    }


    function processData(current_index,chIdx,time) {
    	var dataOriginal=allData[chIdx].dataOriginal
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
        recreateData[chIdx] = {
            "data": JSON.parse(JSON.stringify(data)),
            "weight": dataOriginal[current_index].weight,
            "index": current_index
        };
        createChart(data, dataOriginal[current_index].weight, current_index,chIdx,time);
    }



    function createChart(data, weight, current_index,chIdx,time) {
    
    	var addRegionFlag = false,
	        addPredictionLine = false,
	        addPredictionLine2=false,
	        postionLine = 0;
	        startRegion=0,
	        maxticksPred=1,
	        predLine=0,
	        predchange=0,
            predchangepercent=0,
            predchangepercent2=false;
        
    	var width = allData[chIdx].width,
    	    widthpredicted = allData[chIdx].widthpredicted,
    		x = allData[chIdx].x,
    		y = allData[chIdx].y,
    		yAxis = allData[chIdx].yAxis,
    		xpredicted = allData[chIdx].xpredicted,
    		company=allData[chIdx].company,
    		r_index=allData[chIdx].r_index,
    		r_indexprev=allData[chIdx].r_indexprev,
    		data = JSON.parse(JSON.stringify(data));
    	
        var tickCount = parseInt((predDate / prediction_period) * 10);
        var maxticks = parseInt((predDate*10)/width);
       
        
    	d3.selectAll("#timeSeriesChart"+chIdx+" svg").remove();
        $("#controlPanel"+chIdx).html("");
        $("#addRegion"+chIdx).unbind('click').click(addRegion);
        $("#addPrediction"+chIdx).on("click", addPred);
        
        if(widthpredicted<300){
        	maxticksPred=parseInt(600/widthpredicted);
        }
        
        var xAxis = d3.svg.axis().scale(x).orient("bottom").innerTickSize(-height).ticks(tickCount);
        var xAxispredicted = d3.svg.axis().scale(xpredicted).orient("bottom").innerTickSize(-height).ticks(10);

         
        var svg = d3.select("#timeSeriesChart"+chIdx)
            .append("svg")
            .attr("width", width + 100)
            .attr("height", height + margin.top)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + 0 + ")");

          var hoverLine = svg.append("line")
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke","blue");


        var newsSvg=svg.append("g")
            .attr("class","news-svg")
            .attr("width", width + 100)
            .attr("height",20)



        $.getJSON( "static/data/"+company+"_count.json", function( newsdata ) {
          newsSvg.selectAll("news-rect")
                   .data(newsdata)
                   .enter().append("rect")
                   .filter(function(d){
                        return new Date(d.pub_date)<=new Date(end_date) && new Date(d.pub_date)>=new Date(start_date)}
                   )
                    .attr("class", "news-rect")
                   .attr("x",function(d){ return x(new Date(d.pub_date)-1)})
                   .attr("y",0)
                   .attr("width",allData[chIdx].width/newsdata.length)
                   .attr("height",function(d){return d.count*10})
        });

        var svgpredicted = d3.select("#timeSeriesChart"+chIdx)
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
        
        getNews(company, data[predDate-1].date)
        
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

        var predictionChangeText = svgpredicted.append("text")
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
        			
        			
        var predictionChangeText2 = svgpredicted.append("text")
        			.attr("class", "predictionChange")
        			.attr("transform", "translate(" + widthpredicted + "," + height/2 + ")")
        			.style("display","none")
        			
		predictionChangeText2.append("tspan")
					.attr("class", "predValue")
					.attr("dy",5)
					.attr("x",0)
					
        predictionChangeText2.append("tspan")
        			.attr("class", "predPercent")
        			.attr("dy",10)
        			.attr("x",0)

        var bisectDate = d3.bisector(function(d) {return d.date;}).left; 

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


        function mouseMovePredictionActions() {
            if (addPredictionLine) {
                var y0 = d3.mouse(this)[1]
                var newPrice=y.invert(y0)
                predchange=(newPrice-predictedSeriesData[0].values[0].price).toFixed(2)
                predchangepercent=((predchange/predictedSeriesData[0].values[0].price)*100).toFixed(2)
                predLine.attr("y2", y0)
                predictionChangeText.select(".predValue").text("Change:"+predchange );
                predictionChangeText.select(".predPercent").text("Percent"+predchangepercent+"%" );
                
                predictionChangeText.attr("transform", "translate(" + widthpredicted + "," + y0 + ")")
                return;
            }
            if (addPredictionLine2) {
                var y0 = d3.mouse(this)[1]
                var newPrice=y.invert(y0)
                predchange=(newPrice-predictedSeriesData[0].values[0].price).toFixed(2)
                predchangepercent2=((predchange/predictedSeriesData[0].values[0].price)*100).toFixed(2)
                predLine2.attr("y2", y0)
                predictionChangeText2.select(".predValue").text("Change:"+predchange );
                predictionChangeText2.select(".predPercent").text("Percent"+predchangepercent2+"%" );
                predictionChangeText2.attr("transform", "translate(" + widthpredicted + "," + y0 + ")")
    			
                return;
            }

        }


        function addPred() {
            addPredictionLine = true;
            predchangepercent2=false;
            
            predictionChangeText.style("display","");
            predictionChangeText2.style("display","none");
            
            $("#timeSeriesChart"+chIdx+" .userPrediction").remove();
            
            predLine = svgpredicted.insert("g")
            	.attr("class","userPrediction")
                .append("line") // attach a line
                .style("stroke", "rgb(244, 224, 50)")
                .style("stroke-width", "4")
                .attr("x1", xpredicted(predictedSeriesData[0].values[0].date)) // x position of the first end of the line
                .attr("y1", y(predictedSeriesData[0].values[0].price)) // y position of the first end of the line
                .attr("x2", widthpredicted) // x position of the second end of the line
                .attr("y2", y(predictedSeriesData[0].values[0].price))
                .attr("opacity", 1)
                .attr("class", "predLine")
                .on("click", addPredLine2);

        }
        

        function addPredLine2() {
            addPredictionLine2 = true;
            predictionChangeText2.style("display","");
            
           
            predLine2 = svgpredicted.insert("g")
            	.attr("class","userPrediction")
                .append("line") // attach a line
                .style("stroke", "rgb(244, 224, 50)")
                .style("stroke-width", "4")
                .attr("x1", xpredicted(predictedSeriesData[0].values[0].date)) // x position of the first end of the line
                .attr("y1", y(predictedSeriesData[0].values[0].price)) // y position of the first end of the line
                .attr("x2", widthpredicted) // x position of the second end of the line
                .attr("y2", y(predictedSeriesData[0].values[0].price))
                .attr("opacity", 1)
                .attr("class", "predLine")

        }
        
        

        function stopPred() {
        	if(!addPredictionLine && !addPredictionLine2 && !event.shiftKey)
        		return;
        	if(event.shiftKey)
        		var inverse=true;
        	 $.ajax({
                 type: 'GET',
                 data: {
                     "start_date": start_date,
                     "end_date": end_date,
                     "symbol": company,
                     "prediction_period": prediction_period,
                     "change1":predchangepercent,
                     "change2":predchangepercent2,
                     "inverse":inverse
                 },
                 url: 'data/get-closest',
             }).done(function(result, textStatus, jqXHR) {
                 console.log(result)
                 result=JSON.parse(result);
                 $("#timeSeriesChart"+chIdx+" .userPrediction.points").remove();
	            for (var i = 0; i < result.indices.length; i++) {
	                var d =data[result.indices[i]];
	                var dnext =data[result.indices[i]+parseInt(prediction_period)];

	                 svg.append("line")
	                	.attr("class","predPoints userPrediction points point"+i)
	                	.attr("x1",x(d.date))
	                	.attr("y1",y(d.prices))
	                	.attr("x2",x(dnext.date))
	                	.attr("y2",y(dnext.prices?dnext.prices:data[predDate-1].prices))
	                
	                var predPoints = svg.append("g")
	                	.attr("transform", "translate(" + x(d.date) + "," + y(d.prices) + ")")
	                    .attr("class","userPrediction points")
	                    
	                    
	                    predPoints.append("circle")
	                    .attr("r", 2)
	                    .attr("id","point"+i)
	                    .on("mousemove",function(d){
	                    	var element=d3.select(this);
	                    	var id=element.attr("id")
	                    	element.attr("r",4)
	                    	d3.selectAll("."+id)
	                    	.classed("hidden",false)
	                    	.style("stroke-width","3px");
	                    })
	                    .on("mouseout",function(d){
	                    	var element=d3.select(this);
	                    	var id=element.attr("id")
	                    	element.attr("r",2)
	                    	d3.selectAll(".predPoints")
	                    	.classed("hidden",true)
	                    	.style("stroke-width","2px");
	                    })



	                    predPoints.append("text")
		                    .attr("dy",(i%2)-1+"em")
		                    .attr("class","predPoints point"+i)
		                    .text(result.values[i]+"%")
		                    .classed("hidden",true);
	                	 

	                	
	            }
	            if(addPredictionLine2){
               	   d3.selectAll(".predPoints")
                   	.classed("hidden",true)
                	.classed("allPoints",true);
                	
                }
	            addPredictionLine = false;
	            addPredictionLine2 = false;

             }).fail(function(data) {
                 console.log("Something went wrong..");
             });
           
        }

        


        var hoverText = d3.select("body").append("div")
            .attr("class", "hoverText");



//        hoverText.append("circle")
//            .attr("r", 4.5)
//            .attr("fill","green")
//            .attr("transform", "translate(" + 100 + "," + 0 + ")");
//
//        hoverText.append("text")
//            .attr("x", 9)
//            .attr("dy", ".35em")
//            .attr("dx", "-.35em");

        var clickText = svg.append("g")
            .attr("class", "clickText")
            .style("display", "none");

        clickText.append("circle")
            .attr("r", 3)
            .style("fill", "green");

        clickText.append("text")
            .attr("x", 9)
            .attr("dy", ".35em");

        // **********
        
        function addRegion(time) {
            var end;
            if (time == 1) {
                end = predDate;
                allData[chIdx].boundaries[0] = [0, end];
            } else {
                addRegionFlag = true;
                postionLine = 0;
                r_index++;
                end = 0;
            }

            allData[chIdx].focus1[r_index] = svg.insert("g");
            allData[chIdx].focus2[r_index] = svg.insert("g");

            allData[chIdx].focus1[r_index].append("line") // attach a line
                .style("stroke", "black")
                .attr("pos", 0)
                .attr("x1", 0) // x position of the first end of the line
                .attr("y1", 0) // y position of the first end of the line
                .attr("x2", 0) // x position of the second end of the line
                .attr("y2", height)
                .attr("opacity", 0.2);

            allData[chIdx].focus2[r_index].append("line") // attach a line
                .style("stroke", "black")
                .attr("pos", end)
                .attr("x1", mousePos2(end)[0]) // x position of the first end of the line
                .attr("y1", 0) // y position of the first end of the line
                .attr("x2", mousePos2(end)[0]) // x position of the second end of the line
                .attr("y2", height)
                .attr("opacity", 0.2);

            allData[chIdx].rectangle.push(svg.insert("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", mousePos2(end)[0])
                .attr("height", height)
                .attr("fill", "gray")
                .attr("opacity", 0));

        }
        
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
                if (d3.time.format("%d-%b-%y")(pos[2].date) + " , $" + price == clickText.select("text").text()){
                    clickText.style("display", "none");
                    clickText.select("text").text();
                    return;


                }
                clickText.select("text").text(d3.time.format("%d-%b-%y")(pos[2].date) + " , $" + price);
                clickText.style("display", "")
                getNews(company, pos[2].date);
                return;
            }
            postionLine++;
            addRegionFlag = addRegionFlag && (postionLine <= 1);

            if (!addRegionFlag){
                       allData[chIdx].rectangle[r_index].attr("opacity", 0.2);
                      var i_prev = allData[chIdx]. boundaries[r_index][0]
                      var i_next =  allData[chIdx].boundaries[r_index][1]
                      if (i_prev > i_next) {
                          temp = i_prev
                          i_prev = i_next
                          i_next = temp
                      }
                      weight = 2;
                      allData[chIdx].r_indexprev=r_index;
                      allData[chIdx].r_index=r_index;
                      loadData(i_prev, i_next, 2,chIdx);
            }
        }

        function mouseMoveActions() {
            if (!addRegionFlag) {
                hoverText.style("display", "block")
                hoverLine.style("display","block")
                clearTimeout(timer);
                timer =   setTimeout(function(){
                        hoverText.transition()
                        .style("display","none")

                        hoverLine.style("display","block")
                         .transition()
                         .style("display","none")
                    },3000)



                var x0 = x.invert(d3.mouse(this)[0]), 
                    i = bisectDate(data, x0, 1) // **********
                var pos = mousePos2(i);
                hoverText.style("left", (pos[0] ) +"px")
                          .style("top",pos[1]+"px")
                hoverLine.attr("x1",pos[0] )
                          .attr("x2",pos[0] )
                if (i < predDate) {
                    price = pos[2].prices.toFixed(2)
                } else {
                    price = pos[2].predictedprices.toFixed(2)
                }
                hoverText.html(d3.time.format("%d-%b-%y")(pos[2].date) + " , $" + price);
            } else {
                hoverText.style("display", "none");
                hoverLine.style("display", "none");
                var x0 = x.invert(d3.mouse(this)[0]), // **********
                    i = bisectDate(data, x0, 1) // **********
                var pos = mousePos(i+5)
                if (addRegionFlag) {
                    if (postionLine == 1) {
                        var s = Math.min(startRegion, pos[0]);
                        var dif = Math.abs(pos[0] - startRegion);

                        allData[chIdx].focus2[r_index].select("line") // **********
                            .attr("x1", pos[0])
                            .attr("x2", pos[0])
                            .attr("pos", i);

                        allData[chIdx].rectangle[r_index]
                            .attr("x", s-dif)
                            .attr("width", dif);

                        allData[chIdx].boundaries[r_index][postionLine] = i;

                    } else {
                    	allData[chIdx].focus1[r_index].select("line") // **********
                            .attr("x1", pos[0])
                            .attr("x2", pos[0])
                            .attr("pos", i)

                        startRegion = pos[0];
                    	allData[chIdx].boundaries[r_index] = [i, 0];
                    }

                }
            }

        }


        function showSpecifiedRegions() {
        	var group=d3.select("#timeSeriesChart"+chIdx+" g");
            var controlPanel=$("#controlPanel"+chIdx);
            
        	var rectangle=allData[chIdx].rectangle;
        	var focus1=allData[chIdx].focus1;
        	var focus2=allData[chIdx].focus2;
        	
            for (var i in rectangle) {
                var pos0 = mousePos2(parseInt(focus1[i].select("line").attr("pos")))[0];
                var pos1 = mousePos2(parseInt(focus2[i].select("line").attr("pos")))[0];
                var s = Math.min(pos0, pos0);
                var dif = Math.abs(pos0 - pos1);

                focus1[i].select("line").attr("x1", pos0)
                    .attr("x2", pos0)
                    .attr("height", height);

                focus2[i].select("line").attr("x1", pos1)
                    .attr("x2", pos1)
                	.attr("height", height);
                
                group.node().appendChild(focus2[i].node());
                group.node().appendChild(focus1[i].node());
                group.node().appendChild(rectangle[i].node());

                rectangle[i].attr("x", s)
                    .attr("width", dif)
                    .attr("height", height);
                
                controlPanel.append('<div class="controls control' + i + '"><button class="decrease">-</button><button class="increase">+</button></div>');
                  
                $("#controlPanel"+chIdx+" .control" + i).css({"margin-left": s + dif / 2 });
                 
                if (i == current_index) {
                    rectangle[i].attr("opacity", 0.1 * weight);
                }
                
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
            x0 = x0 || $(window).width()-200;
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
//from here

    $(".process").on("click", function() {
       
        	time=1
            r_index = 0;
            dataOriginal = []
            loadData(0, 0, 3,$(this).attr('index'),1);

    });

    $("body").on("click", ".increase", function() {

        var r_index = $(this).parent().attr("class").slice(-1)
        var chIdx = $(this).parent().parent().attr("id").slice(-1)
        var weight = allData[chIdx].dataOriginal[r_index].weight;
        if (weight >= 5)
            return;
        allData[chIdx].dataOriginal[r_index].weight += 1
        processData(r_index,chIdx);
    })

    $("body").on("click", ".decrease", function() {
    	 var r_index = $(this).parent().attr("class").slice(-1)
         var chIdx = $(this).parent().parent().attr("id").slice(-1)
         var weight = allData[chIdx].dataOriginal[r_index].weight;
         if (weight <= 0)
             return;
         allData[chIdx].dataOriginal[r_index].weight -= 1
         processData(r_index,chIdx);
    });
    
    
    
    $("body").on("slidestop",".slider", function(event, ui) {
        endPos = ui.value;
        var chIdx=parseInt($(this).attr("id").slice(-1));
        if (startPos != endPos) {
            resizeChart((endPos / 100) * $(window).width(),chIdx)
        }

        startPos = endPos;
    });
    
    
    function getNews(q, date) {
    	q=map[q];
        var days = 1;
        var start = new Date(date.getTime());
        var end = new Date(date.getTime());
        start = d3.time.format("%Y%m%d")(start)
        end = d3.time.format("%Y%m%d")(end)

        var selectedDate = d3.time.format("%d-%b-%y")(date)
            	$.ajax({
            	    url : 'http://api.nytimes.com/svc/search/v2/articlesearch.json?',
            	    type : 'GET',
            	    data : {
            	        'q' : q,
            	        'facet_field':'section_name',
            	        'fq':'news_desk:("Business%20Day","business","Your%20Money","Wealth")%20OR%20document_type:("blogpost")',
            	        'begin_date':start,
            	        'end_date':end,
            	        'api-key':'5526d920c3fb4cf3a9a019bd2f0bbbf2'
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
            	        	news+="<a target='_blank' href='"+url+"'><div class='abs'><strong>"+head+"</strong>: "+abs+"</div></a>"
            	        	
            	        }
            	            $("#news").html(news)

            	    },
            	    error : function(request,error)
            	    {
            	    }
            	});

    }
    


    function resizeChart(width,chIdx) {
    	setChartSize(width,chIdx)
        createChart(JSON.parse(JSON.stringify(recreateData[chIdx].data)), recreateData[chIdx].weight, recreateData[chIdx].index,chIdx)
    }


    function setValues(chIdx) {
        prediction_period = $("input[name='predictionPeriod']").val();
        start_date = $("input[name='startDate']").val();
        end_date = $("input[name='endDate']").val();
        allData[chIdx].company =$("input[name='organization"+chIdx+"']").val()
    }
    
    $("#addOrg").on("click",function(){
    	$(".second").show();
    	height=height/3
    	resizeChart(0,0);
    	addNewChart(1);
    	
//    	function createCombined(){
//    		recreateData[2] = {
//    	            "data": [],
//    	            "weight": 3,
//    	            "index": 0
//    	        };
//    		
//    		for (var i=0;i<recreateData[chIdx].data;i++){
//    			recreateData[2].data.push(recreateData[0].data[i]+recreateData[1].data);
//    		}
//    		createChart(recreateData[2].data, recreateData[2].weight, recreateData[2].index,0,1)
//    		   
//    	}
//    	setTimeout(createCombined, 2000);
    	 $(this).remove();
    });
    
    addNewChart(0);
   
});





