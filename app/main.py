import os
import logging

from google.appengine.ext import webapp

import settings
import models
import rest

from rest.views import PageHandler


models.init()

paths = [
    ('/', PageHandler.params('index.html')),
    ('/todo', PageHandler.params('todo.html')),
    ]

paths.extend(rest.get_paths())

app = webapp.WSGIApplication(paths, debug=settings.DEBUG)
