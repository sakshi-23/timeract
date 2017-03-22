import os
import sys

from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)
app.config.from_object('config')


@app.route("/")
def visualize():
    return render_template('index.html')


@app.route("/selection")
def selection():
    return render_template('selection.html')
   
@app.errorhandler(404)
def not_found(error):
    return "TODO: 404 page", error


from app.data.models import mod_data as dataModule
app.register_blueprint(dataModule)