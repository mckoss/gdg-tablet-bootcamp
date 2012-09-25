"""
    GDG Tablet Sample Models
"""
from google.appengine.ext import db

from rest.models import RESTModel, Timestamped, add_models

def init():
    add_models({
            'todo': Todo,
            'image': Image,
            'showdown': Showdown,
            'canvas': Canvas
            })

# Each class specifies the data fields for each Model
# By giving 'form_order' a tuple of strings you can specify the order that the data fields appear
# on the page.  You can also call a javascript function (scoped from json-forms.js) that returns
# some HTML to use instead of an input / textarea.

class Todo(RESTModel, Timestamped):
    text = db.StringProperty()
    done = db.BooleanProperty()
    order = db.IntegerProperty()


class Image(RESTModel, Timestamped):
    title = db.StringProperty()
    pictures = db.TextProperty()
    cats = db.TextProperty()
    puppies = db.TextProperty()
    desktopBackgrounds = db.TextProperty()

    # imageGUI.loadImages(item.pictures) calls the function loadImages from the namespace imageGUI
    #   passing in this item's value for pictures
    form_order = ('title',
                  'imageGUI.loadImages(item.pictures, "pictures");',
                  'imageGUI.loadImages(item.cats, "cats");',
                  'imageGUI.loadImages(item.puppies, "puppies");',
                  'imageGUI.loadImages(item.desktopBackgrounds, "desktopBackgrounds");',)

    computed = ('item.pictures = imageGUI.stringifyImages("pictures");',
                'item.cats = imageGUI.stringifyImages("cats");',
                'item.puppies = imageGUI.stringifyImages("puppies");',
                'item.desktopBackgrounds = imageGUI.stringifyImages("desktopBackgrounds");',)

class Showdown(RESTModel, Timestamped):
    title = db.StringProperty()
    body = db.TextProperty()
    bodyHTML = db.TextProperty()

    form_order = ('title', 'body',)

    computed = ('item.bodyHTML = markdown(item.body);',)


class Canvas(RESTModel, Timestamped):
    data = db.TextProperty()
    orientation = db.StringProperty()

    private_model = True

    form_order = ()
