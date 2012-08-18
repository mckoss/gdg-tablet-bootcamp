import os
import logging

os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

from google.appengine.dist import use_library
use_library('django', '1.2')

from google.appengine.ext import webapp

import settings
import models
import rest

from rest.views import PageHandler


models.init()

paths = [
    ('/', PageHandler.params('index.html')),
    ]

paths.extend(rest.get_paths())

app = webapp.WSGIApplication(paths, debug=True)
