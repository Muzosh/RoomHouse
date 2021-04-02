from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from app import db
import uuid

class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True)
    slug = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))

    clients = db.relationship('Client', backref='room')

    def __repr__(self):
        return '<Room {}>'.format(self.name)

    def set_name(self, name):
        self.name = name
        self.slug = slugify(name)

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