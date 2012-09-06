import os

SITE_NAME = "GDG Tablet Sample"

DEBUG = True
COMBINED = False

# App Engine specific variables.
APP_ID = os.environ.get('APPLICATION_ID')
if APP_ID is not None:
    os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
    LOCAL = os.environ['SERVER_SOFTWARE'].startswith('Development')
    ADMIN_URL = '/_ah/admin' if LOCAL else ('https://appengine.google.com/dashboard?&app_id=%s' % APP_ID)

MANIFEST = 'manifest="/app.manifest"'

# Javascript files used in each application.

COMMON_SCRIPTS = ('jquery', 'namespace-plus', 'underscore')

SCRIPTS = {
    'admin': COMMON_SCRIPTS + (
        'bootstrap', 'image-gui', 'json-forms', 'json-rest', 'showdown'
        ),
    'todo': COMMON_SCRIPTS + (
        'json-rest', 'backbone', 'todos',
        ),
}
