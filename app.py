import os
from flask import Flask, render_template, request
from dotenv import load_dotenv
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant
from flask_sqlalchemy import SQLAlchemy
from DBmodels import *

load_dotenv()
twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_api_key_sid = os.environ.get('TWILIO_API_KEY_SID')
twilio_api_key_secret = os.environ.get('TWILIO_API_KEY_SECRET')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

@app.route('/', methods=['GET', 'POST'])
def create_room():
    if request.method == 'GET':
        return render_template('index.html')
    if request.method == 'POST':
        roomname = request.form.get('roomname')
        username = request.form.get('username')
        password = request.form.get('password')
        
        room = Room()
        room.set_name(name)
        if password:
            room.set_password(password)
        db.session.add(room)
        db.session.commit()
                
        return render_template('index.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', use_debugger=True)