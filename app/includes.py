"""
   includes.py - Javascript includes generator.
"""
import os

import settings

APP_PATH = os.path.dirname(os.path.abspath(__file__))

SCRIPT_INCLUDE = '<script type="text/javascript" src="/js/%s.js"></script>'

def script_includes():
    includes = {}
    for app in settings.SCRIPTS:
        """ Return script includes for all files located beneath the base_dir directory. """
        if settings.COMBINED:
            base_names = ['%s-combined' % app]
        else:
            base_names = settings.SCRIPTS[app]
        includes['%s_scripts' % app] = '\n'.join([SCRIPT_INCLUDE % name for name in base_names])
        includes['%s_manifest' % app] = 'manifest="/manifest/%s.manifest"' % app if settings.APPCACHE else ''

    return includes
