import os
import logging

from google.appengine.ext import webapp

import settings
import models
import rest
import includes
from includes import App

from rest.views import PageHandler
from rest.views import AdminPageHandler


models.init()

COMMON_SCRIPTS = ('jquery', 'namespace-plus', 'app-cache', 'underscore',)
App('main',
    styles=('bootstrap', 'bootstrap-responsive', 'admin')
    )

App('admin',
    scripts=COMMON_SCRIPTS + ('bootstrap', 'image-gui', 'json-forms', 'json-rest', 'showdown'),
    styles=('bootstrap', 'bootstrap-responsive', 'forms', 'thumbnail-display', 'media-upload', 'admin'),
    images=('arrow-back.png', 'arrow-fwd.png', 'delete.png', 'plus-big.png')
    )

App('todos',
    scripts=COMMON_SCRIPTS + ('json-rest', 'backbone', 'todos'),
    styles=('todos',),
    images=('destroy.png',)
    )

App('canvas',
    scripts=COMMON_SCRIPTS + ('bootstrap-colorpicker', 'modernizr-touch-only', 'canvas'),
    styles=('bootstrap', 'colorpicker', 'canvas'),
    images=('alpha.png','hue.png','saturation.png')
    )

paths = [
    ('/', PageHandler.params('index.html', app='main')),
    ('/todos', PageHandler.params('todos.html', app='todos')),
    ('/canvas', PageHandler.params('canvas.html', app='canvas')),
    ('/admin', AdminPageHandler.params('admin.html', app='admin')),
    ]

paths.extend(includes.App.get_paths())
paths.extend(rest.get_paths())

app = webapp.WSGIApplication(paths, debug=settings.DEBUG)
