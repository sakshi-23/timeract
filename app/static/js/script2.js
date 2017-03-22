  $( function() {
    var availableTags = [],companySymMap = {};
    $.getJSON( "static/data/company_list.json", function( data ) {
      $.each( data, function( d ) {
        availableTags.push( data[d]['Company']);
        companySymMap[data[d]['Company']] = data[d]['Symbol']
      });

    });

    $( "#tags" ).autocomplete({
      source: availableTags
    });

     $("#timeline, #percentChange, #greaterlesser").on("change",function(){
         $.ajax({
            url:"/data/get-filtered-companies",
            data:{
                "percent":$("#percentChange").val(),
                "timeline":$("#timeline").val(),
                "greaterlesser":$("#greaterlesser").val()
            },
            success:function(data) {
                 data=JSON.parse(data)
                 var orgs = []
                 for (i in data.organizations){
                 var cur = data.organizations[i]
                 orgs.push('<button class="btn btn-primary btn-sym" type="button"><span class="sym">'+symbolMap[cur.name]+'('+cur.name+')'+'</span><span class="badge">'+Math.round(cur.change,2)+'%</span></button>')
                 }
                 $("#organizations").html(orgs)

            }
            });

    })


    $(document).on("click",'.btn-sym',function(){
        var sym = $(this).find("span").html().split("(")[1]
        window.location.href="/?SYM="+sym.substring(0,sym.length-1);
    });


    $(".go").on("click",function(){
        window.location.href="/?SYM="+companySymMap[$("#tags").val()];
    });



  } );

var symbolMap = {"AAPL":"Apple Inc.","ABBV":"AbbVie Inc.","ABT":"Abbott Laboratories","AMZN":"Amazon.com","AXP":"American Express Inc.","BA":"Boeing Co.","BAC":"Bank of America Corp","BIIB":"Biogen Idec","BK":"The Bank of New York Mellon","BLK":"BlackRock Inc","BMY":"Bristol-Myers Squibb","BRK.B":"Berkshire Hathaway","DIS":"The Walt Disney Company","DOW":"Dow Chemical","DUK":"Duke Energy","EMR":"Emerson Electric Co.","EXC":"Exelon","F":"Ford Motor","FB":"Facebook","FDX":"FedEx","FOX":"21st Century Fox","FOXA":"21st Century Fox","GD":"General Dynamics","GE":"General Electric Co.","GILD":"Gilead Sciences","GM":"General Motors","GOOG":"Alphabet Inc","GOOGL":"Alphabet Inc","GS":"Goldman Sachs","HAL":"Halliburton","HD":"Home Depot","HON":"Honeywell","IBM":"International Business Machines (IBM)","INTC":"Intel Corporation","JNJ":"Johnson & Johnson Inc","JPM":"JP Morgan Chase & Co","KHC":"Kraft Heinz","KMI":"Kinder Morgan Inc/DE","KO":"The Coca-Cola Company","NKE":"Nike","ORCL":"Oracle Corporation","OXY":"Occidental Petroleum Corp.","PCLN":"Priceline Group Inc/The","PEP":"Pepsico Inc.","V":"Visa Inc.","VZ":"Verizon Communications Inc","WBA":"Walgreens Boots Alliance","WFC":"Wells Fargo","WMT":"Wal-Mart","XOM":"Exxon Mobil Corp"}
