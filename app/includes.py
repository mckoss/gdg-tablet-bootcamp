"""
   includes.py - Javascript includes generator.
"""
import os

import settings

APP_PATH = os.path.dirname(os.path.abspath(__file__))

SCRIPT_INCLUDE = '<script type="text/javascript" src="%s"></script>'

script_precedence = ['jquery.js', 'namespace-plus.js', 'underscore.js', 'bootstrap.js']
script_skip = ['combined.js', 'combined-min.js']


def script_includes(base_dir):
    """ Return script includes for all files located beneath the base_dir directory. """
    paths = script_paths(base_dir)
    base_paths = ['/%s/%s' % (base_dir, path) for path in paths]
    return '\n'.join([SCRIPT_INCLUDE % path for path in base_paths])


def script_paths(base_dir):
    def script_priority(s1, s2):
        n1 = script_precedence.index(s1) if s1 in script_precedence else 999
        n2 = script_precedence.index(s2) if s2 in script_precedence else 999
        return n1 - n2

    crawl_dir = os.path.join(APP_PATH, base_dir)
    if settings.COMBINED:
        return ['combined.js']
    """ Return {"dir_name": [files], ... } for all directories titled 'js'. """
    script_paths = []
    for root, dirs, files in os.walk(crawl_dir, topdown=False):
        files.sort(script_priority)
        for file_name in files:
            if file_name in script_skip:
                continue
            if file_name.endswith('.js'):
                script_paths.append(os.path.relpath(os.path.join(root, file_name), crawl_dir))

    return script_paths
