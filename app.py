import os
import uuid
import sqlalchemy
from flask import Flask, render_template, request, flash, redirect, url_for
#from dotenv import load_dotenv
#from twilio.jwt.access_token import AccessToken
#from twilio.jwt.access_token.grants import VideoGrant
from flask_sqlalchemy import SQLAlchemy
#from DBmodels import *
from database import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask.blueprints import Blueprint


web = Blueprint('web', __name__,
                 template_folder='templates',
                 static_folder='static')

#load_dotenv()
#twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
#twilio_api_key_sid = os.environ.get('TWILIO_API_KEY_SID')
#twilio_api_key_secret = os.environ.get('TWILIO_API_KEY_SECRET')

#app = Flask(__name__)
#db_path = os.path.join(os.path.dirname(__file__), 'database.db')
#db_uri = 'sqlite:///{}'.format(db_path)
#app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
#app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
#app.config['SECRET_KEY'] = 'super secret key'
#db = SQLAlchemy(app)
#db.create_all()
#db.app = app

class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True)
    #slug = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))

    clients = db.relationship('Client', backref='room')

    def __repr__(self):
        return '<Room {}>'.format(self.name)

    def set_name(self, name):
        self.name = name
        #self.slug = slugify(name)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def authenticate(self, password=None):
        """Attempt to authenticate access to the room."""

        if ((password is None and self.password_hash is None)
                or (password and check_password_hash(self.password_hash, password))):
            return Client(uuid=uuid.uuid4().hex, room=self)

        return None
    
class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), default='Guest')
    uuid = db.Column(db.String(32), unique=True, default=uuid.uuid4().hex)
    
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'))

    def __repr__(self):
        return '<Client {}>'.format(self.uuid) 


@web.route('/', methods=['GET', 'POST'])
def create_room():
    if request.method == 'GET':
        return render_template('createroom.html')
    if request.method == 'POST':
        roomname = request.form.get('roomname')
        password = request.form.get('password')
        
        try:
            room = Room()
            room.set_name(roomname)
            if password:
                room.set_password(password)
            db.session.add(room)
            db.session.commit()
                
            return redirect('/joinroom/{}'.format(room.id), code=307) #tu je problem, css sa nenacita
            #return redirect(url_for('joinroom',id=room.id)) #toto asi nefunguje
        except:
            flash('The room name "{}" is not available'.format(roomname))
            return render_template('createroom.html')
            
@web.route('/joinroom/<id>', methods=['GET', 'POST'])
def joinroom(id):
    if request.method == 'GET':
    #return 'Room id ' + str(id)
        return render_template('joinroom.html')


#if __name__ == '__main__':
#    app.run(host='127.0.0.1', use_debugger=True)