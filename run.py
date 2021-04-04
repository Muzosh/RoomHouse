from database import db
from flask import Flask
import os.path
from app import Room, Client
from app import web
from dotenv import load_dotenv
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant


def create_app():
    load_dotenv()
    twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_api_key_sid = os.environ.get('TWILIO_API_KEY_SID')
    twilio_api_key_secret = os.environ.get('TWILIO_API_KEY_SECRET')
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
    app.run(host='127.0.0.1')