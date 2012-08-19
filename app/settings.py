import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
# from google.appengine.dist import use_library
# use_library('django', '1.3')

DEBUG = True
SITE_NAME = "GDG Tablet Sample"
LOCAL = os.environ['SERVER_SOFTWARE'].startswith('Development')
APP_ID = os.environ['APPLICATION_ID']
ADMIN_URL = '/_ah/admin' if LOCAL else 'https://appengine.google.com/dashboard?&app_id=%s' % APP_ID
