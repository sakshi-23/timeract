var availableItems = []
var symbolReverseMap = {}
var symbolMap={}
var events = {};
//var selectedItem ="AAPL"

$(function(){

    //Pre Load mapping data
    $.getJSON( "/data/get-map-file", function( data ) {
        var data = data.map;
        $.each( data, function( d ) {
            availableItems.push( data[d]['Item']);
            symbolReverseMap[data[d]['Item']] = data[d]['File']
            symbolMap[data[d]['File']] = data[d]['Item']
        });

        $( "#tags" ).autocomplete({
            source: availableItems
        });
    });

    $(".toggler").on("click",function(){
        var glyph = $(this).find(".glyphicon")
        if(glyph.hasClass("glyphicon-menu-down")){
            glyph.removeClass("glyphicon-menu-down");
            glyph.addClass("glyphicon-menu-up");

        }
        else{
            glyph.removeClass("glyphicon-menu-up");
            glyph.addClass("glyphicon-menu-down");

        }

    });



//    getNews('IBM',new Date(),new Date());


    //Get filtered records
     $("#timeline, #percentChange, #greaterlesser").on("change",function(){
         $.ajax({
            url:"/data/get-filtered-items",
            data:{
                "percent":$("#percentChange").val(),
                "timeline":$("#timeline").val(),
                "greaterlesser":$("#greaterlesser").val()
            },
            success:function(data) {
                 data=JSON.parse(data)
                 var items = []
                 for (i in data.items){
                 var cur = data.items[i]
                 items.push('<button class="btn btn-primary btn-sym" type="button"><span class="sym">'+symbolMap[cur.name]+'('+cur.name+')'+'</span><span class="badge">'+Math.round(cur.change,2)+'%</span></button>')
                 }
                 $("#itemList").html(items)

            }
            });

    })


    $(document).on("click",'.btn-sym',function(){
        var sym = $(this).find("span").html().split("(")[1];
        selectedItem= sym.substring(0,sym.length-1)
        createVis();
        $("#viewAll").removeClass("in");
        $("#visualize").addClass("in");
    });

    $("#showVis").on("click",function(){
        selectedItem =symbolReverseMap[$("#tags").val()]
        createVis();
        $("#viewAll").removeClass("in");
         $("#visualize").addClass("in");
    });

    $("#eventSelection").on("change",function(){
        if(this.value =='news'){
             getNews(selectedItem,startDate,predictDate);
        }
    });

    $("#fileUpload").on("click",function(){
    var formData = new FormData($("#fileUploadForm")[0]);
    $(".loader").removeClass("hidden");
    $.ajax({
        url: '/data/save-input-files',
        type : 'post',
        data : formData,
        async : true,
        processData: false,
        contentType: false,
        }).done(function(data, textStatus, jqXHR){
              data=JSON.parse(data);
              if (data.success=="false")
                 alert("file upload error");
              $('.alert').show()
              return false;
        }).fail(function(data){
            alert("file upload error");
            return false;

        });
    });

    $("#mapUpload").on("click",function(){
    var formData = new FormData($("#mapUploadForm")[0]);
    $(".loader").removeClass("hidden");
    $.ajax({
        url: '/data/save-map-file',
        type : 'post',
        data : formData,
        async : true,
        processData: false,
        contentType: false,
        }).done(function(data, textStatus, jqXHR){
            data=JSON.parse(data)["map"];
            if (data.success=="false")
                alert("file upload error");
            $('.alert').show()
            $.each( data, function( d ) {
                availableItems.push( data[d]['Item']);
                symbolReverseMap[data[d]['Item']] = data[d]['File']
                symbolMap[data[d]['File']] = data[d]['Item']
            });
            $( "#tags" ).autocomplete({
                source: availableItems
            });
            return false;
        }).fail(function(data){
            alert("file upload error");
            window.location.href="#"
            return false;
        });
    });


});




function getNews(q, start,end) {
	q=symbolMap[q];
    start = d3.time.format("%Y%m%d")(start)
    end = d3.time.format("%Y%m%d")(end)
    $.ajax({
        url : '/data/get-news',
        type : 'GET',
        data : {
            'q' : q,
            'begin_date':start,
            'end_date':end,
        },
        dataType:'json',
        success:function(data){
            events[q]=data;
            showEvents(data);

    }});
}
