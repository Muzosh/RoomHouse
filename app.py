import os
import uuid
import sqlalchemy
from flask import Flask, render_template, request, flash, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from database import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask.blueprints import Blueprint
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant

twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_api_key_sid = os.environ.get('TWILIO_API_KEY_SID')
twilio_api_key_secret = os.environ.get('TWILIO_API_KEY_SECRET')

web = Blueprint('web', __name__,
                 template_folder='templates',
                 static_folder='static')


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

    def authenticate(self, password):
    #def authenticate(self, password=None):
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
    
    def set_name(self, name):
        self.name = name


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
        #if password:
            room.set_password(password)
            db.session.add(room)
            db.session.commit()
            return redirect(url_for('web.joinroom', id=room.id), code=307)
        except:
            flash('The room name "{}" is not available'.format(roomname))
            return render_template('createroom.html')

@web.route('/joinroom/<id>', methods=['GET', 'POST'])
def joinroom(id):
    if request.method == 'GET':
        session['auth'] = False
        return render_template('joinroom.html')
    
    if request.method == 'POST':
        session['auth'] = False
        room = Room.query.filter(Room.id == id).first()
        username = request.form.get("username")
        password = request.form.get("password")
        
        if username:
            
            # Commented IfElse should prevent you from kicking someone by taking your name
            #  problem is that we cant delete from this DB when disconnecting, so even you disconnect, you cant use your name to get back
            # if db.session.query(Client).filter_by(Client.name == username, Client.room_id == id).first() is not None
        
                client = room.authenticate(password=password)
                if client:
                    client.set_name(username)
                    db.session.add(client)
                    db.session.commit()
                    
                    token = AccessToken(twilio_account_sid, twilio_api_key_sid, twilio_api_key_secret, identity=username)
                    token.add_grant(VideoGrant(room=room.id))
                    
                    session['auth'] = True
                    session['token'] = token.to_jwt().decode()
                    session['username'] = username
                    session['roomname'] = room.name
                    session['roomid'] = room.id
                    
                    return redirect(url_for('web.room', id=room.id), code=302)
                else:
                    flash('Incorrect password')
                    return render_template('joinroom.html')
            # else:
            #     flash('Username already exists!')
            #     return render_template('joinroom.html')
        else:
            flash("Username is required!")
            return render_template('joinroom.html')


@web.route('/room/<id>', methods=['GET', 'POST'])
def room(id):
    if not session.get('auth'):
        return redirect(url_for('web.joinroom', id=id), code=302)

    return render_template(
        'room.html',
        room_id=id,
        client_name=session.get('username'),
        room_name=session.get('roomname'),
        token=session.get('token'))


@web.route('/about', methods=['GET', 'POST'])
def about_page():
    return render_template('about.html', room_id=session.get('roomname'))