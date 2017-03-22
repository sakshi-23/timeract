from flask import Blueprint,  render_template,request
import json
import pandas as pd
import numpy as np
from collections import OrderedDict
import math
from datetime import date, timedelta as td
import glob
import os
import app.data.lstm as lstm
import time
import matplotlib.pyplot as plt


def plot_results(predicted_data, true_data):
    fig = plt.figure(facecolor='white')
    ax = fig.add_subplot(111)
    ax.plot(true_data, label='True Data_old')
    plt.plot(predicted_data, label='Prediction')
    plt.legend()
    plt.show()

def plot_results_multiple(predicted_data, true_data, prediction_len):
    fig = plt.figure(facecolor='white')
    ax = fig.add_subplot(111)
    ax.plot(true_data, label='True Data_old')
    #Pad the list of predictions to shift it in the graph to it's correct start
    for i, data in enumerate(predicted_data):
        padding = [None for p in range(i * prediction_len)]
        plt.plot(padding + data, label='Prediction')
        plt.legend()
    plt.show()

def predict_lstm():
    # start = int(request.args.get('start'))
    # start = int(request.args.get('end'))
    # symbol = request.args.get('symbol')
    # predicted_time = int(request.args.get('prediction_period'))
    start =-100
    end = -1
    symbol='IBM'
    predicted_time=30
    epochs = 1
    seq_len = 50

    print('> Loading data... ')

    X_train, y_train, X_test,X_test_Val = lstm.load_data(data, seq_len, True)

    print('> Data_old Loaded. Compiling...')

    model = lstm.build_model([1, 50, 100, 1])

    history = model.fit(
        X_train,
        y_train,
        batch_size=512,
        nb_epoch=epochs,
        validation_split=0.0)

    print (history)

    predictions = lstm.predict_sequences_multiple(model, X_test, seq_len, predicted_time)
    predictions = [X_test_Val*(1+value) for value in predictions]

    print(predictions)

    #predicted = lstm.predict_sequence_full(model, X_test, predicted_time)
    #plot_results_multiple(predictions, y_test, 50)


predict_lstm()