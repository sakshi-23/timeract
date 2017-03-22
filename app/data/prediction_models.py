import app.data.lstm as lstm

def predict_lstm(data,prediction_data,predicted_time=10,seq_len=50):
    # start = int(request.args.get('start'))
    # start = int(request.args.get('end'))
    # symbol = request.args.get('symbol')
    # predicted_time = int(request.args.get('prediction_period'))
    epochs = 1

    print('> Loading data... ')

    X_train, y_train, X_test,X_test_Val = lstm.load_data(data,prediction_data, seq_len,True)

    print('> Data_old Loaded. Compiling...')

    model = lstm.build_model([1, 50, 100, 1])

    model.fit(
        X_train,
        y_train,
        batch_size=50,
        nb_epoch=epochs,
        validation_split=0.0)

    predictions = lstm.predict_sequences_multiple(model, X_test, seq_len, predicted_time)
    predictions = [X_test_Val*(1+value) for value in predictions]

    return predictions