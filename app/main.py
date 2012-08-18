import logging

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

import settings
import models
import rest

from rest.views import PageHandler



models.init()

paths = [
    ('/', PageHandler.using('index.html')),
    ]

paths.extend(rest.get_paths())


def main():
    application = webapp.WSGIApplication(paths, debug=True)
    run_wsgi_app(application)


if __name__ == '__main__':
    main()
