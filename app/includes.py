"""
   includes.py - Javascript includes generator.

   Handles combining scripts and application manifest files.
"""
import os
import logging
import settings

APP_PATH = os.path.dirname(os.path.abspath(__file__))

SCRIPT_INCLUDE = '<script type="text/javascript" src="/js/%s.js"></script>'
STYLE_INCLUDE = '<link type="text/css" rel="stylesheet" href="/css/%s.css" />'


class App(object):
    all_apps = {}

    def __init__(self, name, scripts=None, styles=None):
        self.scripts = scripts or ()
        self.styles = styles or ()
        self.all_apps[name] = self

    @classmethod
    def get_app_data(cls, app_name):
        data = {'scripts': '',
                'styles': '',
                'manifest': '',
                }
        if app_name is None:
            logging.warning("No application defined in template.")
            return data

        if app_name not in cls.all_apps:
            logging.error("No such app: %s.", app_name)

        app = cls.all_apps[app_name]

        if len(app.scripts) > 0:
            if settings.COMBINED:
                base_names = ['%s-combined' % app_name]
            else:
                base_names = app.scripts
            data['scripts'] = '\n'.join([SCRIPT_INCLUDE % name for name in base_names])

        if len(app.styles) > 0:
            data['styles'] = '\n'.join([STYLE_INCLUDE % name for name in app.styles])

        data['manifest'] = 'manifest="/manifest/%s.manifest"' % app_name if settings.APPCACHE else ''
        return data
