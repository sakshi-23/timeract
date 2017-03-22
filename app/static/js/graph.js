var parseDate = d3.time.format("%Y%m%d").parse;
var svg,focus,context,eventSVG,predictionChangeText;
var freq=3600*24*100;
var focusCreate=true;
var all_data, data_concatenated,predTime, predPercent;
var color = d3.scale.category10()
            .range(['rgb(178, 178, 178)', '#2196F3', '#FF9800'])
var data_history=[];
var weights =[]
var region_elements =[];
bisectDate = d3.bisector(function(d) { return d.date; }).left;
var regionShade = ['rgb(105, 105, 105)','#99d8c9','#66c2a4','#2ca25f','#006d2c']
moveChange=false;
var regions=[];
var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };
var width = $(window).width()-2*margin.left,
    height = 300,
    margin2 = {top: 300+margin.bottom, right: 10, bottom: 20, left: 0},
    height2 = 60;

var x = d3.time.scale().range([0, width]),
    x2 = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]),
    y2 = d3.scale.linear().range([height2, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("left");

var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushoff);




function addRegion(){
    $("#regionSelected").show();
    $(".weight-info").show();
    region = d3.svg.brush()
      .x(x2)
      .on("brush", brushed)
    regions.push(region);
    weights.push(1);
    lastRegion = context.append("g")
        .attr("class", "x brush region")
        .attr("id", "id"+regions.length)
        .style("fill",regionShade[1])
        .call(region)
      .selectAll("rect")
        .attr("y", -6)
        .attr("height", height);

}

function brushed(){
//    console.log( regions[regions.length-1].extent());
}

function regionSelected(){

    $("#regionSelected").hide();
    $(".weight-info").hide();
    d3.selectAll(".region").style("pointer-events","none");
    if(weights[weights.length-1]>0){
        region_elements.push(d3.select("#id"+regions.length).node());
        getRegionPrediction();
    }
    else{
        regions.pop();
        weights.pop();
    }


}

function changeWeight(){
    weights[weights.length-1]=parseInt($("#weightControls").val());
    lastRegion.style("fill",regionShade[$("#weightControls").val()]);

}

function brushended(){
    return;
}

function showEvents(event_data){

    eventSVG=focus.append("g")
            .attr("class","event-svg")
            .attr("width", width + 100)
            .attr("height",20)


    eventSVG.selectAll("event-rect")
           .data(event_data.date_counts)
           .enter().append("rect")
           .filter(function(d){
                return (new Date(d.date)<=predictDate && new Date(d.date)>=startDate)}
           )
           .attr("class", "event-rect")
           .attr("x",function(d){ return x(new Date(d.date)-1)})
           .attr("y",0)
           .attr("width",1+width*(freq)/(x.domain()[1]-x.domain()[0]))
           .attr("height",function(d){return d.count*10})
           .on("click", function(d) {
             docs=d.content;
             if($(".date").html()=="News : "+d3.time.format("%Y-%m-%d")(new Date(d.date))){
                div.html(news).style("display", "none");
                return;
             }
             var news="<div class='date'>News : "+d3.time.format("%Y-%m-%d")(new Date(d.date))+"</div>"
        	        for (i in docs){
        	        	var abs=docs[i]['abs']
        	        	var head=docs[i]['head']
        	        	var url=docs[i]['url'];
        	        	news+="<div class='abs'><strong>"+head+"</strong>: "+abs+"<a href='"+url+"'>URL</a></div>"

        	        }

            div.transition()
                .duration(200)
                .style("display", "block");
            div.html(news)
            })



}



function mouseMovePredictionActions() {
        if(!moveChange)
            return;
        var y0 = d3.mouse(this)[1]
        var last_val =all_data[0].values[all_data[0].values.length-1].value;
        predPercent = y.invert(y0);
        predPercent = Math.round(100*(predPercent-last_val)/last_val,2)
//        predchangepercent=((predchange/predictedSeriesData[0].values[0].price)*100).toFixed(2)
        predLine.attr("y2", y0)
       predictionChangeText.select(".predPercent").text("Percent: "+Math.round(predPercent,2)+"%" );
    }

function addPred() {
    moveChange=true;
    focusCreate=true;
      x.domain([all_data[0].values[all_data[0].values.length-1].date,x2.domain()[1]]);
      var i=0,j=data_concatenated.length;
      if(!brush.empty()){
          x0 = brush.extent()[0];
          x1 = brush.extent()[1];
          i = bisectDate(data_concatenated, x0, 1)
          j = bisectDate(data_concatenated, x1, 1)
      }
      var sliced = data_concatenated.slice(i,j)
          y.domain([
            d3.min(sliced, function(c) { return c.value*0.90; }),
            d3.max(sliced, function(c) { return c.value*1.2; }),
        ]);

      focus.selectAll("path.line").attr("d",  mkPath);
      focus.select(".x.axis").call(xAxis);
      focus.select(".y.axis").call(yAxis);
      if(eventSVG){
        eventSVG.selectAll(".event-rect")
           .attr("x",function(d){ return x(new Date(d.date))})
           .attr("width",1+width*freq/(x.domain()[1]-x.domain()[0]))

      }
    focus.selectAll(".userPrediction").remove();
    predictionChangeText= focus.append("text")
        			.attr("class", "predictionChange")
        			.attr("transform", "translate(0 ," + height/2+ ")")
    predictionChangeText.append("tspan")
                .attr("class", "predTime userPrediction")
                .attr("dy",5)
                .attr("x",0)
                .text("Instances: "+ $('#predictionRange').slider("option", "value"))

    predictionChangeText.append("tspan")
                .attr("class", "predPercent userPrediction")
                .attr("dy",10)
                .attr("x",0)
                .text("Percent: 0%")

    predRect = focus.append("rect")
            .attr("width", width) // **********
            .attr("height",height) // **********
            .style("fill", "none") // **********
            .style("pointer-events", "all")
            .attr("class","userPrediction predictionRect")
            .on("mousemove", mouseMovePredictionActions)
            .on("click",getClosest)
            .style("opacity", 0)

    predLine = focus.insert("g")
        .attr("class","user-prediction-line userPrediction")
        .append("line") // attach a line
        .attr("x1", 0) // x position of the first end of the line
        .attr("y1",y(all_data[0].values[all_data[0].values.length-1].value)) // y position of the first end of the line
        .attr("x2",width)
        .attr("y2",height/2 )
        .on("click",getClosest)
        .attr("class", "pred-line")
    }


function similarClick(){
    var change1 = all_data[1].values[all_data[1].values.length-1].value;
    var change2 = all_data[2].values[all_data[2].values.length-1].value;
    var org = all_data[0].values[all_data[0].values.length-1].value
    change1 = 100*(change1-org)/org;
    change2 = 100*(change2-org)/org;
    $.ajax({
            url:"/data/get-nearest-dates",
            data:{
                "prediction_period":predTime,
                "change1": change1,
                "change2": change2,
                "start":-($('#historyRange').slider("option", "max")-$('#historyRange').slider("option", "value")),
                "symbol":selectedItem
            },
            success:function(result) {
                result=JSON.parse(result);
                var d = all_data[0].values[result.model1];
                var change = 100*(all_data[0].values[result.model1+predTime].value - all_data[0].values[result.model1].value)/all_data[0].values[result.model1].value;
                var predPoints = context.append("g")
                        .attr("transform", "translate(" + x2(d.date) + "," + y2(d.value) + ")")
                        .attr("class","userPrediction")

                predPoints.append("circle")
                 .style("fill", color(all_data[1].name))
                .attr("r", 3)

               predPoints.append("text")
                .attr("dy","2em")
                .style("fill","#dadada")
                .style("font-size","6px")
                .text(change.toFixed(2)+"%");


                var predPoints = focus.append("g")
                        .attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")")
                        .attr("class","userPrediction")

                predPoints.append("circle")
                 .style("fill", color(all_data[1].name))
                .attr("r", 3)

               predPoints.append("text")
                .attr("dy","2em")
                .style("fill","#dadada")
                .style("font-size","6px")
                .text(change.toFixed(2)+"%");


                var d = all_data[0].values[result.model2];
                var change = 100*(all_data[0].values[result.model2+predTime].value - all_data[0].values[result.model2].value)/all_data[0].values[result.model2].value;

                var predPoints = context.append("g")
                        .attr("transform", "translate(" + x2(d.date) + "," + y2(d.value) + ")")
                        .attr("class","userPrediction")

                predPoints.append("circle")
                 .style("fill", color(all_data[2].name))
                .attr("r", 3)

               predPoints.append("text")
                .attr("dy","2em")
                .style("fill","#dadada")
                .style("font-size","6px")
                .text(change.toFixed(2)+"%");


                var predPoints = focus.append("g")
                        .attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")")
                        .attr("class","userPrediction")

                predPoints.append("circle")
                 .style("fill", color(all_data[2].name))
                .attr("r", 3)

               predPoints.append("text")
                .attr("dy","2em")
                .style("fill","#dadada")
                .style("font-size","6px")
                .text(change.toFixed(2)+"%");



            }
            });



}

function getClosest(){
    moveChange=false;
    d3.select(".predictionRect").remove();
     $.ajax({
            url:"/data/get-closest",
            data:{
                "prediction_period":predTime,
                "change": predPercent,
                "start":-($('#historyRange').slider("option", "max")-$('#historyRange').slider("option", "value")),

                "symbol":selectedItem
            },
            success:function(result) {

                context.selectAll(".userPrediction").remove();
                result = JSON.parse(result);
                for (var i = 0; i < result.indices.length; i++) {
                    var d = all_data[0].values[result.indices[i]];
                    var dnext =all_data[0].values[result.indices[i]+predTime];



                   var predPoints = context.append("g")
                        .attr("transform", "translate(" + x2(d.date) + "," + y2(d.value) + ")")
                        .attr("class","userPrediction")


                        predPoints.append("circle")
                         .style("fill", "red")
                        .attr("r", 3)


                       predPoints.append("text")
                        .attr("dy",(i%2)-1+"em")
                        .style("fill","#dadada")
                        .style("font-size","6px")
                        .text(result.values[i].toFixed(2)+"%");


                    focus.append("line")
                        .attr("class","userPrediction ")
                        .attr("x1",x(d.date))
                        .attr("y1",y(d.value))
                        .attr("x2",x(dnext.date))
                        .attr("y2",y(dnext.value))
                        .style("stroke", "black")


                }
            }
            });


}


function getRegionPrediction(){
    var x0 = regions[regions.length-1].extent()[0];
    i = bisectDate(data_concatenated, x0, 1);
    var x0 = regions[regions.length-1].extent()[1];
    j = bisectDate(data_concatenated, x0, 1);


    $(".loader").show();
    $.ajax({
        url:"/data/get-info",
        data:{
            "prediction_period":predTime,
            "start":-($('#historyRange').slider("option", "max") - $('#historyRange').slider("option", "value")-i) ,
             "end":-($('#historyRange').slider("option", "max")- $('#historyRange').slider("option", "value")-j),
            "symbol":selectedItem
        },
        success:function(data) {
            data = JSON.parse(data);
            $(".loader").hide();
            data_history.push(data.data);
            all_data=[]
            var total= 0;
            all_data[0]=data_history[0][0];
            for (var i =0;i<data_history.length;i++){
                for (var j=1;j<data_history[i].length;j++){
                    if(!all_data[j])
                            all_data[j]={'name':data_history[i][j].name,"values":[]}
                    values = data_history[i][j].values;
                    for(var k=0;k<values.length;k++){
                         if(!all_data[j]['values'][k])
                            all_data[j]['values'][k]={'date':values[k].date,'value':0}
                        all_data[j]['values'][k]['value']+=values[k]['value']*weights[i];
                    }

                }
            }
            for (var i =0;i<weights.length;i++){
                total+=weights[i];
            }
            for (var j =1;j<all_data.length;j++){
                for (var k =0;k<all_data[j]['values'].length;k++){
                   all_data[j]['values'][k]['value']=(all_data[j]['values'][k]['value']/total).toFixed(2);
                }
            }
            makeGraph(all_data);
        }
    })



}

function createVis(){
    $(".loader").show();
    $.ajax({
            url:"/data/get-info",
            data:{
                "prediction_period":predTime,
                "start":$(".ui-slider").length>0?-($('#historyRange').slider("option", "max")-$('#historyRange').slider("option", "value")):"",
                 "end":-1,
                "symbol":selectedItem
            },
            success:function(data) {
                data= JSON.parse(data);
                $(".loader").hide();
                 makeGraph(data.data);
                 all_data =data.data;
                 data_history =[]
                 weights =[]
                 region_elements =[]
                 regions =[]
                 data_history.push(data.data);
                 weights.push(1);
                 predTime=data.pred.val;
                 $( "#historyRange" ).slider({
                      range: "min",
                      min: parseInt(data.range.min),
                      max: parseInt(data.range.max),
                      value: Math.abs(parseInt(data.range.max + data.range.val )),
                      slide: function( event, ui ) {
                        $( "#custom-handle-history" ).text( data.range.max-parseInt(ui.value ));
                      },
                      create: function() {
                        $( "#custom-handle-history" ).text(  Math.abs(parseInt(data.range.val )));
                      },
                      stop: function(){
                        createVis();
                      }

                 });
                 $( "#predictionRange" ).slider({
                      range: "max",
                      min: parseInt(data.pred.min),
                      max: parseInt(data.pred.max),
                      value: parseInt(data.pred.val),
                      slide: function( event, ui ) {
                        $( "#custom-handle-prediction" ).text( ui.value );
                      },
                      create: function() {
                        $( "#custom-handle-prediction" ).text( $( this ).slider( "value" ) );
                      },
                      stop: function(){
                        createVis();
                      }
                 });
                 $("input[type='range']").slider( "refresh" );

            }
            });


    }

function makeGraph(data){
    d3.select("#chart svg").remove('svg');
    focusCreate=true;
    // create the SVG element
    svg = d3.select("#chart")
                .append("svg")
                .attr("width", width+ margin.left)
                .attr("height", height2+height+margin.top+margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    focus = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr("id", "focusElement");

    context = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin2.top + ")")
      .attr("id", "contextElement");
    // Load up the data
    model_names= []
    keys = d3.keys(data)
    for (var i in data){
        if ( !(data[i].values[0].date  instanceof Date)){
             data[i].values.forEach(function(d) {
            d.date = parseDate(d.date);
        });

        }


        model_names.push(data[i].name);
    }
    predictDate = data[1].values[0].date;
    startDate = data[0].values[0].date;
    color.domain(model_names);
    data_concatenated = data[0].values.concat(data[1].values)

    // Set the x and y domains
    x.domain(d3.extent(data_concatenated, function(d) { return d.date; }));
    y.domain([
        d3.min(data, function(c) { return d3.min(c.values, function(v) { return v.value*0.9; }); }),
        d3.max(data, function(c) { return d3.max(c.values, function(v) { return v.value*1.1; }); })
    ]);

    x2.domain(x.domain());
    y2.domain(y.domain());


    var item = focus.selectAll(".item")
      .data(data)
      .enter().append("g")
        .attr("class", "item")
        .append("path")
        .attr("class", "line")
        .attr("d", mkPath)
        .style("stroke", function(d) { return color(d.name); })
        .attr("clip-path", "url(#clip)");

    // Append the series names on the x-axis
    item.append("text")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.value) + ")"; })
      .attr("x", 3)
      .attr("dy", ".35em")
      .attr("fill", "white")

    focusCreate=false;

    // Create the line chart using the custom path generator

    context.selectAll(".item")
        .data(data)
      .enter().append("g")
        .append("path")
        .attr("class", "line")
        .attr("d", mkPath)
        .style("stroke", function(d) { return color(d.name); })
        .attr("clip-path", "url(#clip)");

    context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "x brush")
        .call(brush)
      .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

    // Set the caption for the y-axis
    focus.append("g")
        .attr("class", "y axis")
        .call(yAxis).append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Values");

    focus.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

     focus.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() { mover.style("display", null); })
      .on("mouseout", function() { mover.style("display", "none"); })
      .on("mousemove", mousemove)

     var mover = focus.append("g")
      .attr("class", "focus")
      .style("display", "none");

      mover.append("circle")
          .attr("r", 4.5);

      mover.append("text")
          .attr("x", -50)
          .attr("dy", ".35em");

    function mousemove() {
        if(moveChange)
            return false;
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data_concatenated, x0, 1),
            d0 = data_concatenated[i - 1],
            d1 = data_concatenated[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        mover.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
        mover.select("text").text(parseInt(d.value).toFixed(2));
      }

      for (var i in region_elements){
        $("#contextElement").append(region_elements[i]);
      }


}

 function brushoff() {
      focusCreate=true;
      x.domain(brush.empty() ? x2.domain() : brush.extent());
      var i=0,j=data_concatenated.length;
      if(!brush.empty()){
          x0 = brush.extent()[0];
          x1 = brush.extent()[1];
          i = bisectDate(data_concatenated, x0, 1)
          j = bisectDate(data_concatenated, x1, 1)


      }
      var sliced = data_concatenated.slice(i,j)
          y.domain([
            d3.min(sliced, function(c) { return c.value*0.9; }),
            d3.max(sliced, function(c) { return c.value*1.1; }),
        ]);

      focus.selectAll("path.line").attr("d",  mkPath);
      focus.select(".x.axis").call(xAxis);
      focus.select(".y.axis").call(yAxis);
      if(eventSVG){
        eventSVG.selectAll(".event-rect")
           .attr("x",function(d){ return x(new Date(d.date))})
           .attr("width",1+width*freq/(x.domain()[1]-x.domain()[0]))

      }
      d3.selectAll(".userPrediction").remove();

    }


// This is the function used to make a path for general line. This is solid originally
	// and then switches to a dashed line beyond the prediction date. There aren't any path
	// generators within D3 that do this so we have to do it at a very raw level.
	function mkPath(d) {
	        var yLine;
	        if (focusCreate)
	            yLine=y;
	        else
	            var yLine=y2;
			var prev = -1;
			var lastDate = null;
			// s will be the string to represent the path, using the SVG definition. We're
			// therefore building up this path at the rawest level. See http://www.w3.org/TR/SVG/paths.html
			var s = "";
			// Go through all the values that we have
			for(var i = 0; i < d.values.length; i++) {
				// Skip anything without a defined date
				if(d.values[i].date && d.values[i].date < predictDate) {
					// If the date is beyond our threshold then we want a dashed line
					{
						// Just create a normal path
						if(prev == -1) { s = s + "M"; }
						s = s + " " + x(d.values[i].date) + " " + yLine(d.values[i].value);
					}
					last_val= d.values[i];
				}
				else if(d.values[i].date && d.values[i].date >= predictDate) {
					// If the date is beyond our threshold then we want a dashed line
					if(i==0){
                         var xp = d3.scale.linear().range([last_val.date, d.values[i].date]);
                         var yp = d3.scale.linear().range([last_val.value, d.values[i].value]);

					}
					else{
					     var xp = d3.scale.linear().range([d.values[i-1].date, d.values[i].date]);
                         var yp = d3.scale.linear().range([d.values[i-1].value, d.values[i].value]);

					}



                    // Create little segments of a line, alternating between a fill and a non-filled section
                    for(var j = 0.1; j < 1; j = j + 0.2) {
                        s = s + "M" + x(xp(j)) + " " + yLine(yp(j));
                        s = s + " " + x(xp(j+0.1)) + " " + yLine(yp(j+0.1));
                    }
				}
				prev = d.values[i].date;
			}
			return s;
	}

$(function(){

//    createVis('IBM');
    // Define the div for the tooltip
    div = d3.select('.event-tip');
    $("#userPredictionButton").on("click",addPred);
    $("#predictionSimilarButton").on("click",similarClick);
    $("#regionsButton").on("click",addRegion);
    $("#regionSelected").on("click",regionSelected);
    $("#weightControls").on("blur",changeWeight);



});




//  // This is the function to create an area, where we wish
//  // to just track the line to start with and then build up and
//  // increasing band as time progresses beyond the threshold date.
//  var area = d3.svg.area()
//		.x(function(d) { return x(d.date); })
//		.y0(function(d) {
//			// Take the current value and work out a difference between the date and the
//			// threshold date. Add this to the value, and do the reverse for the bottom y value.
//			if(d.date > predictDate && d.value) {
//				return y(d.value + ((d.date - predictDate) / 1000 / 60 / 60 / 24 / 10))
//			}
//			return 0;
//		})
//		.y1(function(d) {
//			if(d.date > predictDate && d.value) {
//				return y(d.value - ((d.date - predictDate) / 1000 / 60 / 60 / 24 / 10))
//			}
//			return 0;
//		})