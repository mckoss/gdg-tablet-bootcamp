import os
from includes import App

SITE_NAME = "GDG Tablet Sample"

DEBUG = True
COMBINED = False
APPCACHE = True

# App Engine specific variables.
APP_ID = os.environ.get('APPLICATION_ID')
if APP_ID is not None:
    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
    LOCAL = os.environ['SERVER_SOFTWARE'].startswith('Development')
    ADMIN_URL = '/_ah/admin' if LOCAL else ('https://appengine.google.com/dashboard?&app_id=%s' % APP_ID)

# Javascript files used in each application.

COMMON_SCRIPTS = ('jquery', 'namespace-plus', 'app-cache', 'underscore',)

App('admin',
    scripts=COMMON_SCRIPTS + ('bootstrap', 'image-gui', 'json-forms', 'json-rest', 'showdown'),
    styles=('desktop', 'bootstrap', 'bootstrap-responsive', 'forms', 'thumbnail-display', 'admin')
    )

App('todos',
    scripts=COMMON_SCRIPTS + ('json-rest', 'backbone', 'todos'),
    styles=('todos',))

App('canvas',
    scripts=COMMON_SCRIPTS + ('bootstrap-colorpicker', 'modernizr-touch-only', 'canvas')
    )
