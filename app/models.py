"""
    Mobile Museum Models
"""
from google.appengine.ext import db

import rest.models as rest_models # Possibly unnecessary? (used in another file)
from rest.models import RESTModel, Timestamped

def init():
    rest_models.add_models({
            'page': Page,
            'tracker': Tracker
            })


class Page(RESTModel, Timestamped):
    title = db.StringProperty()
    shortCode = db.StringProperty()
    images = db.TextProperty()
    mapLocations  = db.TextProperty()
    # TODO: Don't download Markdown as well as HTML body in mobile fetch
    body = db.TextProperty()
    bodyHTML = db.TextProperty()

    form_order = ('title', 'shortCode', 'body', 'imageGUI.loadPictures(item.images);',
                  'imageGUI.loadMaps(item.mapLocations)',)
    read_only = ('created', 'modified')

    computed = ('item.bodyHTML = markdown(item.body);',)


class Tracker(RESTModel, Timestamped):
    ip = db.StringProperty()
    browser = db.StringProperty()
