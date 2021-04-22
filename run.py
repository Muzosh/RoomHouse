import os
from database import db
from flask import Flask
from app import Room, Client, web
from dotenv import load_dotenv
import threading
import time
from twilio.rest import Client as TwilioClient

def SyncDatabaseThread():
    twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_api_key_sid = os.environ.get('TWILIO_API_KEY_SID')
    twilio_api_key_secret = os.environ.get('TWILIO_API_KEY_SECRET')
    
    while (True):
        client = TwilioClient(twilio_api_key_sid, twilio_api_key_secret, twilio_account_sid)
        roomList = client.video.rooms.list()
        roomIds = [int(room.unique_name) for room in roomList]
        
        with app.app_context():
            for dbRoom in db.session.query(Room).all():
                if dbRoom.id not in roomIds:
                    db.session.delete(dbRoom)
                else:
                    for dbClient in dbRoom.clients:
                        currentRoom = next((room for room in roomList if room.unique_name == str(dbRoom.id)), None)
                        if currentRoom != None and dbClient.name not in [part.identity for part in currentRoom.participants.list()]:
                            db.session.delete(dbClient)
            db.session.commit()
        time.sleep(2*60)

        

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config['DEBUG'] = True
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    db_uri = 'sqlite:///{}'.format(db_path)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'super secret key'
    db.init_app(app)
    app.register_blueprint(web, url_prefix='')
    return app   

def setup_database(app):
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    app = create_app()
    # Because this is just a demonstration we set up the database like this.
    if not os.path.isfile('database.db'):
        setup_database(app)

    threadMethod = threading.Thread(target=SyncDatabaseThread)
    threadMethod.daemon = True
    threadMethod.start()
    app.run(host='127.0.0.1')