"""
    Mobile Museum Models
"""
from google.appengine.ext import db

from rest.models import RESTModel, Timestamped, add_models

def init():
    add_models({
            'todo': Todo
            })


class Todo(RESTModel, Timestamped):
    user_id = db.StringProperty()
    text = db.StringProperty()
    done = db.BooleanProperty()
    order = db.IntegerProperty()
