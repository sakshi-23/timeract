from flask import Blueprint,  render_template,request
import json
import pandas as pd
import numpy as np
from collections import OrderedDict
import math
from datetime import date, timedelta as td
import glob
import requests
import os,io
import app.data.prediction_models as prediction_models
import time
mod_data = Blueprint('data', __name__, url_prefix='/data')
from collections import defaultdict

def symbol_to_path(symbol, base_dir='app/data/data'):
    """Return CSV file path given ticker symbol."""
    return os.path.join(base_dir, "{}.csv".format(str(symbol)))

@mod_data.route('/get-filtered-items')
def get_filtered():
    files = glob.glob('app/data/data/*.csv')
    percent = int(request.args.get('percent'))
    greater = int(request.args.get('greaterlesser'))
    date1 = int(request.args.get('timeline'))
    date2 = 0
    items = []
    for file in files:
        df = pd.read_csv(file,index_col='Date',
                parse_dates=True, usecols=[0, 6], na_values=['nan'],names=['Date','Values'],header=0)

        change =(df.iloc[date2]['Values']-df.iloc[date1]['Values'])*100/df.iloc[date1]['Values']
        if greater>0:
            if change> percent:
                items.append({"name":os.path.basename(file)[:-4],"change":change})
        else:
            if change< percent:
                items.append({"name":os.path.basename(file)[:-4],"change":change})

    items = sorted(items, key=lambda k: k['change'],reverse=True)
    return json.dumps({"items":items})


@mod_data.route('/get-closest')
def get_closest():
    start = int(request.args.get('start'))
    symbol = request.args.get('symbol')
    predictedTime = int(request.args.get('prediction_period'))
    change = request.args.get('change')
    df = pd.read_csv(symbol_to_path(symbol), index_col='date',
                     parse_dates=True, usecols=[0, 6], na_values=['nan'], names=['date', 'value'], header=0)
    df = df.sort_index()
    data = df[start:]
    dist=0.2
    indices=[]
    values=[]
    change=float(change)
    Y = (((data.copy().shift(-1*predictedTime)/data) - 1.0)*100)
    distance = abs(Y-change)
    min_val = 100
    min_index=-1
    poss =-1
    for i,row in enumerate(distance.values):
        if row[0]<min_val and row[0] >= dist:
            min_val=row[0]
            min_index=i
            poss = Y.values[i][0]
        if row[0] < dist:
            indices.append(i)
            values.append(Y.values[i][0])
            min = row[0]
            min_index=-1
    if min_index!=-1:
        indices.append(min_index)
        values.append(poss)
    return json.dumps({"indices": indices, "values":values})


#Main Run Thread
@mod_data.route('/get-info')
def get_info():
    # return  json.dumps({"range": {"min": "0", "val": -200, "max": 8166}, "data": [{"name": "base", "values": [{"date": "20160413", "value": 110.19618999999999}, {"date": "20160414", "value": 110.2552}, {"date": "20160415", "value": 108.042227}, {"date": "20160418", "value": 105.71123500000002}, {"date": "20160419", "value": 105.15061499999999}, {"date": "20160420", "value": 105.36698899999999}, {"date": "20160421", "value": 104.22608199999999}, {"date": "20160422", "value": 103.940854}, {"date": "20160425", "value": 103.350729}, {"date": "20160426", "value": 102.632739}, {"date": "20160427", "value": 96.210203}, {"date": "20160428", "value": 93.269411}, {"date": "20160429", "value": 92.197345}, {"date": "20160502", "value": 92.09899200000001}, {"date": "20160503", "value": 93.613649}, {"date": "20160504", "value": 92.639944}, {"date": "20160505", "value": 92.263917}, {"date": "20160506", "value": 91.749363}, {"date": "20160509", "value": 91.81863}, {"date": "20160510", "value": 92.442033}, {"date": "20160511", "value": 91.541563}, {"date": "20160512", "value": 89.394274}, {"date": "20160513", "value": 89.57239}, {"date": "20160516", "value": 92.897216}, {"date": "20160517", "value": 92.511299}, {"date": "20160518", "value": 93.570098}, {"date": "20160519", "value": 93.21386600000001}, {"date": "20160520", "value": 94.223192}, {"date": "20160523", "value": 95.420524}, {"date": "20160524", "value": 96.875137}, {"date": "20160525", "value": 98.57713199999999}, {"date": "20160526", "value": 99.358863}, {"date": "20160527", "value": 99.299486}, {"date": "20160531", "value": 98.81461800000001}, {"date": "20160601", "value": 97.429272}, {"date": "20160602", "value": 96.69702099999999}, {"date": "20160603", "value": 96.894924}, {"date": "20160606", "value": 97.597491}, {"date": "20160607", "value": 97.993305}, {"date": "20160608", "value": 97.904251}, {"date": "20160609", "value": 98.606817}, {"date": "20160610", "value": 97.795402}, {"date": "20160613", "value": 96.320994}, {"date": "20160614", "value": 96.439741}, {"date": "20160615", "value": 96.123091}, {"date": "20160616", "value": 96.528803}, {"date": "20160617", "value": 94.332041}, {"date": "20160620", "value": 94.104446}, {"date": "20160621", "value": 94.905971}, {"date": "20160622", "value": 94.549739}, {"date": "20160623", "value": 95.093977}, {"date": "20160624", "value": 92.42224499999999}, {"date": "20160627", "value": 91.076482}, {"date": "20160628", "value": 92.610251}, {"date": "20160629", "value": 93.411777}, {"date": "20160630", "value": 94.599212}, {"date": "20160701", "value": 94.886177}, {"date": "20160705", "value": 93.995597}, {"date": "20160706", "value": 94.529945}, {"date": "20160707", "value": 94.93565600000001}, {"date": "20160708", "value": 95.667907}, {"date": "20160711", "value": 95.96477}, {"date": "20160712", "value": 96.400159}, {"date": "20160713", "value": 95.855921}, {"date": "20160714", "value": 97.75581899999999}, {"date": "20160715", "value": 97.745922}, {"date": "20160718", "value": 98.784933}, {"date": "20160719", "value": 98.824515}, {"date": "20160720", "value": 98.91356999999999}, {"date": "20160721", "value": 98.389119}, {"date": "20160722", "value": 97.627183}, {"date": "20160725", "value": 96.320994}, {"date": "20160726", "value": 95.65801}, {"date": "20160727", "value": 101.87226700000001}, {"date": "20160728", "value": 103.247715}, {"date": "20160729", "value": 103.119078}, {"date": "20160801", "value": 104.93982}, {"date": "20160802", "value": 103.386256}, {"date": "20160803", "value": 104.68254}, {"date": "20160804", "value": 105.329219}, {"date": "20160805", "value": 106.930996}, {"date": "20160808", "value": 107.816449}, {"date": "20160809", "value": 108.254196}, {"date": "20160810", "value": 107.44833600000001}, {"date": "20160811", "value": 107.378694}, {"date": "20160812", "value": 107.627417}, {"date": "20160815", "value": 108.92078000000001}, {"date": "20160816", "value": 108.821284}, {"date": "20160817", "value": 108.66210600000001}, {"date": "20160818", "value": 108.522821}, {"date": "20160819", "value": 108.80138999999998}, {"date": "20160822", "value": 107.95573300000001}, {"date": "20160823", "value": 108.293993}, {"date": "20160824", "value": 107.478182}, {"date": "20160825", "value": 107.020532}, {"date": "20160826", "value": 106.393753}, {"date": "20160829", "value": 106.274363}, {"date": "20160830", "value": 105.458552}, {"date": "20160831", "value": 105.55803999999999}, {"date": "20160901", "value": 106.184827}, {"date": "20160902", "value": 107.17971899999999}, {"date": "20160906", "value": 107.14986499999999}, {"date": "20160907", "value": 107.806498}, {"date": "20160908", "value": 104.981001}, {"date": "20160909", "value": 102.60320899999999}, {"date": "20160912", "value": 104.90141499999999}, {"date": "20160913", "value": 107.39858799999999}, {"date": "20160914", "value": 111.199076}, {"date": "20160915", "value": 114.97966799999999}, {"date": "20160916", "value": 114.33298700000002}, {"date": "20160919", "value": 112.999835}, {"date": "20160920", "value": 112.989884}, {"date": "20160921", "value": 112.96999}, {"date": "20160922", "value": 114.034524}, {"date": "20160923", "value": 112.134277}, {"date": "20160926", "value": 112.30340600000001}, {"date": "20160927", "value": 112.51233300000001}, {"date": "20160928", "value": 113.36793999999999}, {"date": "20160929", "value": 111.60698500000001}, {"date": "20160930", "value": 112.472544}, {"date": "20161003", "value": 111.945245}, {"date": "20161004", "value": 112.42279599999999}, {"date": "20161005", "value": 112.472544}, {"date": "20161006", "value": 113.308249}, {"date": "20161007", "value": 113.477379}, {"date": "20161010", "value": 115.45721999999999}, {"date": "20161011", "value": 115.70594299999999}, {"date": "20161012", "value": 116.740624}, {"date": "20161013", "value": 116.38247}, {"date": "20161014", "value": 117.02914299999999}, {"date": "20161017", "value": 116.94955800000001}, {"date": "20161018", "value": 116.869965}, {"date": "20161019", "value": 116.521754}, {"date": "20161020", "value": 116.462055}, {"date": "20161021", "value": 116.004406}, {"date": "20161024", "value": 117.04904499999999}, {"date": "20161025", "value": 117.645979}, {"date": "20161026", "value": 114.999563}, {"date": "20161027", "value": 113.89523999999999}, {"date": "20161028", "value": 113.13911999999999}, {"date": "20161031", "value": 112.960039}, {"date": "20161101", "value": 110.920507}, {"date": "20161102", "value": 111.019995}, {"date": "20161103", "value": 109.83000200000001}, {"date": "20161104", "value": 108.839996}, {"date": "20161107", "value": 110.410004}, {"date": "20161108", "value": 111.059998}, {"date": "20161109", "value": 110.879997}, {"date": "20161110", "value": 107.790001}, {"date": "20161111", "value": 108.43}, {"date": "20161114", "value": 105.709999}, {"date": "20161115", "value": 107.110001}, {"date": "20161116", "value": 109.989998}, {"date": "20161117", "value": 109.949997}, {"date": "20161118", "value": 110.059998}, {"date": "20161121", "value": 111.730003}, {"date": "20161122", "value": 111.800003}, {"date": "20161123", "value": 111.230003}, {"date": "20161125", "value": 111.790001}, {"date": "20161128", "value": 111.57}, {"date": "20161129", "value": 111.459999}, {"date": "20161130", "value": 110.519997}, {"date": "20161201", "value": 109.489998}, {"date": "20161202", "value": 109.900002}, {"date": "20161205", "value": 109.110001}, {"date": "20161206", "value": 109.949997}, {"date": "20161207", "value": 111.029999}, {"date": "20161208", "value": 112.120003}, {"date": "20161209", "value": 113.949997}, {"date": "20161212", "value": 113.300003}, {"date": "20161213", "value": 115.190002}, {"date": "20161214", "value": 115.190002}, {"date": "20161215", "value": 115.82}, {"date": "20161216", "value": 115.970001}, {"date": "20161219", "value": 116.639999}, {"date": "20161220", "value": 116.949997}, {"date": "20161221", "value": 117.059998}, {"date": "20161222", "value": 116.290001}, {"date": "20161223", "value": 116.519997}, {"date": "20161227", "value": 117.260002}, {"date": "20161228", "value": 116.760002}, {"date": "20161229", "value": 116.730003}, {"date": "20161230", "value": 115.82}, {"date": "20170103", "value": 116.150002}, {"date": "20170104", "value": 116.019997}, {"date": "20170105", "value": 116.610001}, {"date": "20170106", "value": 117.910004}, {"date": "20170109", "value": 118.989998}, {"date": "20170110", "value": 119.110001}, {"date": "20170111", "value": 119.75}, {"date": "20170112", "value": 119.25}, {"date": "20170113", "value": 119.040001}, {"date": "20170117", "value": 120.0}, {"date": "20170118", "value": 119.989998}, {"date": "20170119", "value": 119.779999}, {"date": "20170120", "value": 120.0}, {"date": "20170123", "value": 120.08000200000001}, {"date": "20170124", "value": 119.970001}, {"date": "20170125", "value": 121.879997}]}, {"name": "lstm", "values": [{"date": "20170126", "value": 125.70706531405449}, {"date": "20170127", "value": 126.0973933339119}, {"date": "20170128", "value": 126.6217727959156}, {"date": "20170129", "value": 127.03187584877014}, {"date": "20170130", "value": 127.49861374497414}, {"date": "20170131", "value": 127.64024287462234}, {"date": "20170201", "value": 127.79633313417435}, {"date": "20170202", "value": 127.94189304113388}, {"date": "20170203", "value": 128.05470496416092}]}, {"name": "svm", "values": [{"date": "20170126", "value": 127.84005199559033}, {"date": "20170127", "value": 128.20335750840604}, {"date": "20170128", "value": 128.63169188797474}, {"date": "20170129", "value": 129.21884415484965}, {"date": "20170130", "value": 129.9648347441107}, {"date": "20170131", "value": 130.80333671718836}, {"date": "20170201", "value": 131.7239948194474}, {"date": "20170202", "value": 132.72393747791648}, {"date": "20170203", "value": 133.59917017444968}]}], "pred": {"min": "0", "val": 10, "max": 19}})
    prediction={}
    all_data = {}
    start = int(request.args.get('start')) if request.args.get('start') else -100
    end = int(request.args.get('end')) if request.args.get('end') else -1
    symbol = request.args.get('symbol')
    predicted_time = int(request.args.get('prediction_period')) if (request.args.get('prediction_period')) else 10
    df = pd.read_csv(symbol_to_path(symbol), index_col='date',
                     parse_dates=True, usecols=[0, 6], na_values=['nan'], names=['date', 'value'], header=0)
    df = df.sort_index()
    data = df['value'].tolist()[start:end]
    prediction_data = df['value'].tolist()[-20:]
    if end-start<=6:
        seq =end-start-2
    else:
        seq =5
    prediction['lstm']=prediction_models.predict_lstm(data,prediction_data,predicted_time,seq)
    if end - start <= 21:
        seq =end-start-2
    else:
        seq =20
    prediction['svm'] = prediction_models.predict_lstm(data,prediction_data, predicted_time,seq)
    all_data['lstm'] = []
    all_data['svm'] = []
    all_data['base'] = []
    last_date = ''
    for i, row in df[start:end].iterrows():
        date_val = pd.to_datetime(i).strftime('%Y%m%d')
        all_data['base'].append({'date':date_val,'value':row['value']})
        last_date =pd.to_datetime(i)

    for i in range(1,predicted_time):
        date_val = last_date + td(days=i)
        date_val = pd.to_datetime(date_val).strftime('%Y%m%d')
        all_data['lstm'].append({'date':date_val,'value':prediction['lstm'][i]})
        all_data['svm'].append({'date': date_val, 'value': prediction['svm'][i]})

    return json.dumps({ "range":{"min":"0","max":df.shape[0],"val":start},
                        "pred":{"min":"0","max": math.ceil(len(data)/5),"val":predicted_time},
                        'data':[{'name':'base','values':all_data['base']},{'name':'lstm','values':all_data['lstm']},{'name':'svm','values':all_data['svm']}]})


@mod_data.route("/save-input-files", methods=["POST"])
def save_input_files():
    input_file = request.files.getlist('file')
    for file in input_file:
        try:
            if file and file.filename.rsplit('.', 1)[1] == 'csv':
                filename = file.filename
                file_path = os.path.join('app/data/data', filename)
                file.save(file_path)
        except:
            return json.dumps({"success":False})

        return json.dumps({"success": True})


@mod_data.route("/save-map-file", methods=["POST"])
def save_map_files():
    map_file = request.files['map']
    path =os.path.join('app/data/map', map_file.filename)
    map_file.save(path)
    with open(path) as data_file:
        result = json.load(data_file)
        return json.dumps({"map":result})


@mod_data.route("/get-map-file")
def get_map_files():
    path = os.path.join('app/data/map', "mapping.json")
    try:
        with open(path) as data_file:
            result = json.load(data_file)
            return json.dumps({"map": result})
    except:
        return json.dumps({})


@mod_data.route("/get-nearest-dates")
def getNearest():
    start = int(request.args.get('start'))
    symbol = request.args.get('symbol')
    predictedTime = int(request.args.get('prediction_period'))
    change1 = request.args.get('change1')
    change2 = request.args.get('change2')
    df = pd.read_csv(symbol_to_path(symbol), index_col='date',
                     parse_dates=True, usecols=[0, 6], na_values=['nan'], names=['date', 'value'], header=0)
    df = df.sort_index()
    data = df[start:]
    change1 = float(change1)
    change2 = float(change2)
    Y = (((data.copy().shift(-1 * predictedTime) / data) - 1.0) * 100)
    distance = abs(Y - change1)
    min = 100
    min_index1 = -1
    for i, row in enumerate(distance.values):
        if row[0] < min:
            min = row[0]
            min_index1 = i

    distance = abs(Y - change2)
    min = 100
    min_index2 = -1
    for i, row in enumerate(distance.values):
        if row[0] < min:
            min = row[0]
            min_index2 = i

    return json.dumps({"model1": min_index1, "model2":min_index2})



@mod_data.route('/get-news')
def getNews():
    import time
    q = request.args.get('q')
    begin_date = request.args.get('begin_date')
    end_date = request.args.get('end_date')
    if os.path.exists('app/data/events/'+q+begin_date+end_date+'.json'):
        with open('app/data/events/'+q+begin_date+end_date+'.json') as data_file:
            result = json.load(data_file)
        return json.dumps(result)

    url = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?&q='+q+'&facet_field=section_name&fq=news_desk%3A(%22Business%2520Day%22%2C%22business%22%2C%22Your%2520Money%22%2C%22Wealth%22)%2520OR%2520document_type%3A(%22blogpost%22)&begin_date='+begin_date+'&end_date='+end_date+'&api-key=1f86faded8d55105c9156394dae8cc5d%3A8%3A74713945'
    response = requests.get(url)
    jsonData=json.loads(response.text)
    pages=int((jsonData['response']['meta']['hits'])/10) #get count of the number of pages
    result= jsonData['response']['docs'] if jsonData['response']['docs'] else []
    for page in range(1,pages): #get all the data
        time.sleep(1)
        url ='http://api.nytimes.com/svc/search/v2/articlesearch.json?&q=IBM&facet_field=section_name&fq=news_desk%3A(%22Business%2520Day%22%2C%22business%22%2C%22Your%2520Money%22%2C%22Wealth%22)%2520OR%2520document_type%3A(%22blogpost%22)&begin_date='+begin_date+'&end_date='+end_date+'&api-key=1f86faded8d55105c9156394dae8cc5d%3A8%3A74713945&page='+str(page)
        try:
            response = requests.get(url)
            jsonData=json.loads(response.text)
            result=result+jsonData['response']['docs']
        except:
            print (url)
    output = open('app/data/events/'+q+begin_date+end_date+'.json', 'w')
    output.write(json.dumps(result))

    with open('app/data/events/'+q+begin_date+end_date+'.json') as data_file:
        result = json.load(data_file)
    dates = {}
    result2 = []
    for row in result:
        if row["pub_date"] not in dates:
            dates[row["pub_date"]] = {'count': 0, 'content': []}

        if row['abstract'] != None:
            absl = row['abstract']

        else:
            absl = row['lead_paragraph']
        head = row['headline']['main']
        url = row['web_url']
        dates[row["pub_date"]]['count'] = dates[row["pub_date"]]['count'] + 1
        dates[row["pub_date"]]['content'].append({'head': head, 'abs': absl, 'url': url})

    for date in dates:
        result2.append({"date": date, 'count': dates[date]['count'],'content':dates[date]['content']})
    json_dump = json.dumps({'date_counts':result2,})
    output = open('app/data/events/'+q+begin_date+end_date+'.json', 'w')
    output.write(json_dump)
    return json_dump
