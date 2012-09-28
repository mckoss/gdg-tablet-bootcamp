import os

# This users (as well as appengine-admins) will have read/write access to all data.
admin_emails = ('mckoss@gmail.com',)

SITE_NAME = "GDG Tablet Sample"

DEPLOY = True

if DEPLOY:
    DEBUG = False
    COMBINED = True
    MINIFIED = True
    APPCACHE = True
else:
    DEBUG = True
    COMBINED = False
    APPCACHE = False
    MINIFIED = False

# App Engine specific variables.
APP_ID = os.environ.get('APPLICATION_ID')
if APP_ID is not None:
    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
    LOCAL = os.environ['SERVER_SOFTWARE'].startswith('Development')
    ADMIN_URL = '/_ah/admin' if LOCAL else ('https://appengine.google.com/dashboard?&app_id=%s' % APP_ID)

