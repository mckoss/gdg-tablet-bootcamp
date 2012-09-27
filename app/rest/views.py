import os
import sys
import re
import logging
import json
import traceback
from hashlib import sha1

from google.appengine.api import users
from google.appengine.ext import webapp, db
from google.appengine.ext.webapp import template
from google.appengine.api import images

import settings

import models
import includes

JSON_MIMETYPE = 'application/json'
JSON_MIMETYPE_CS = JSON_MIMETYPE + '; charset=utf-8'

IMAGE_SIZE_LARGE = 960
IMAGE_SIZE_MOBILE = 480
IMAGE_SIZE_THUMBNAIL = 64


def require_admin_login(response_function):
    def wrapper(handler, *args, **kwargs):
        if handler.user is None:
            handler.redirect(users.create_login_url(dest_url=handler.request.url))
            return
        if not users.is_current_user_admin():
            handler.redirect(users.create_logout_url(dest_url=handler.request.url))
            return
        response_function(handler, *args, **kwargs)

    return wrapper


def require_login(response_function):
    def wrapper(handler, *args, **kwargs):
        if handler.user is None:
            handler.redirect(users.create_login_url(dest_url=handler.request.url))
            return
        response_function(handler, *args, **kwargs)

    return wrapper


class UserHandler(webapp.RequestHandler):
    """ This subclass of RequestHandler sets user and user_id
    variables to be used in processing the request. """
    def __init__(self, *args, **kwargs):
        super(UserHandler, self).__init__(*args, **kwargs)
        self.user = users.get_current_user()
        self.user_email = self.user.email() if self.user else 'anonymous'


class JSONHandler(webapp.RequestHandler):
    def handle_exception(self, exception, debug_mode):
        self.error(500)
        trace = traceback.format_exc()
        logging.info(trace)
        self.response.out.write(str(exception))
        if debug_mode:
            self.response.out.write("\n\nTrace:\n\n%s" % trace)

    def json_response(self, json_dict, cache=False):
        self.response.headers['Content-Type'] = JSON_MIMETYPE_CS
        if cache:
            self.response.headers['Cache-Control'] = 'max-age=3600'
        result = pretty_json(json_dict)

        etag = '"%s"' % sha1(result).hexdigest()
        self.response.headers['ETag'] = etag
        if etag == self.request.headers.get('If-None-Match'):
            self.response.set_status(304)
            return

        self.response.out.write(result)


class SchemaHandler(UserHandler, JSONHandler):
    def get(self):
        results = {'schema': {}}
        for model_name, model in models.rest_models.items():
            results['schema'][model_name] = model.get_schema()
        self.json_response(results)


class SigninHandler(UserHandler, JSONHandler):
    def get(self):
        url = self.request.get('url', '/')
        username = self.user and self.user.nickname()
        # Warning: Any use of transient variables in a cached page
        # will not be updated when the user state changes.
        self.json_response({
                'signIn': users.create_login_url(url),
                'signOut': users.create_logout_url(url),
                'username': username or '',
                'siteName': settings.SITE_NAME,
                'adminURL': settings.ADMIN_URL,
                'isAdmin': models.is_admin(),
                'userEmail': self.user_email,
                })


class ListHandler(UserHandler, JSONHandler):
    def get_model(self, model_name):
        if model_name not in models.rest_models:
            self.error(404)
            self.response.out.write("Model '%s' not in %r" % (model_name, models.rest_models))
            return None
        return models.rest_models[model_name]

    # get all list of items
    def get(self, model_name):
        model = self.get_model(model_name)
        if model is None:
            return

        query = model.all()

        should_cache = False

        for property_name in self.request.arguments():
            value = self.request.get(property_name)
            if property_name == 'cache':
                should_cache = True
                continue
            if '*' == value[-1]:
                filter_query_by_prefix(query, model, property_name, value[:-1])
            else:
                filter_query_by_value(query, model, property_name, value)

        results = query.fetch(1000)
        items = [item.get_dict() for item in results]
        self.json_response(items, cache=should_cache)

    # create an item
    def post(self, model_name):
        model = self.get_model(model_name)
        if model is None:
            return

        data = json.loads(self.request.body)
        item = model(owner_email=self.user_email)

        if hasattr(item, 'set_defaults'):
            item.set_defaults()

        item.set_dict(data)
        try:
            item.put()
        except models.PermissionError, e:
            self.error(403)
            self.response.out.write(e)
            return

        self.json_response(item.get_dict())


class ItemHandler(UserHandler, JSONHandler):
    def get(self, model_name, id):
        item = self.get_item(model_name, id)
        if item is not None:
            self.json_response(item.get_dict())

    def get_item(self, model_name, id):
        if model_name not in models.rest_models:
            self.error(404)
            self.response.out.write("No such model: %s." % model_name)
            return None
        model = models.rest_models[model_name]
        try:
            item = model.get_by_id(int(id))
        except models.PermissionError, e:
            self.error(403)
            self.response.out.write(e)
            return None
        if item is None:
            self.error(404)
            self.response.out.write("No such model: %s[%s]." % (model_name, id))
            return None
        return item

    def put(self, model_name, id):
        logging.info("called put")
        item = self.get_item(model_name, id)
        if item is None:
            self.error(404)
            self.response.out.write("No such model: %s[%s]." % (model_name, id))
            return

        data = json.loads(self.request.body)
        item.set_dict(data)
        try:
            item.put()
        except models.PermisssionError, e:
            self.error(403)
            self.response.out.write(e)
            return
        self.json_response(item.get_dict())

    def delete(self, model_name, id):
        item = self.get_item(model_name, id)
        if item:
            try:
                item.delete()
            except models.PermissionError, e:
                self.error(403)
                self.response.write(e)
                return
        self.json_response({"status": "ok"})


def filter_query_by_prefix(query, model, property_name, prefix):
    last_char = chr(ord(prefix[-1]) + 1)
    logging.info("Prefix filter: '%s' <= %s < '%s'" %
                 (prefix, property_name, prefix[:-1] + last_char))
    query.filter('%s >= ' % property_name, prefix)
    query.filter('%s < ' % property_name, prefix[:-1] + last_char)


def filter_query_by_value(query, model, property_name, value):
    property = model.properties().get(property_name)
    # Get Key() to referenced object for filtering
    if isinstance(property, db.ReferenceProperty):
        kind = property.reference_class.kind()
        value = db.Key.from_path(kind, long(value))

    query.filter('%s = ' % property_name, value)


class ParamHandler(object):
    """ Class factory so we can have parameterized Request Handlers. """
    @classmethod
    def params(cls, *args_p, **kwargs_p):
        class Factory(cls):
            def __init__(self, *args, **kwargs):
                super(Factory, self).__init__(*args, **kwargs)
                self.set_params(*args_p, **kwargs_p)
        return Factory


class PageHandler(ParamHandler, UserHandler):
    """ Request handler for generic pages for webapp views.
    Usage: PageHandler.using("template-name.html"). """
    # TODO: Get rid of package arg
    def set_params(self, template_name, package=None, app=None, **kwargs):
        path = ['templates', template_name]
        if package is not None:
            path.insert(0, package)
        self.template_path = os.path.join(*path)
        self.app_name = app
        self.render_data = kwargs

    def prepare(self):
        username = self.user and self.user.nickname()
        self.render_data.update(includes.App.get_app(self.app_name).get_data())
        self.render_data.update({
            'site_name': settings.SITE_NAME,
            'admin_url': settings.ADMIN_URL,
        })

    def get(self, *args):
        self.prepare()
        result = template.render(self.template_path, self.render_data)
        self.response.out.write(result)


class AdminPageHandler(PageHandler):
    @require_admin_login
    def get(self, *args):
        super(AdminPageHandler, self).get(*args)


class MediaListHandler(UserHandler, JSONHandler):
    @require_admin_login
    def get(self):
        query = models.MediaModel.all(keys_only=True)

        results = query.fetch(1000)

        items = [item.name() for item in results]
        self.json_response(items)


"""
class MediaListHandler(AdminPageHandler):
    def prepare(self):
        super(MediaListHandler, self).prepare()
        self.render_data['images'] = models.MediaModel.all()
"""

class MediaHandler(webapp.RequestHandler):
    def get(self, name):
        size = self.request.get('size', 'mobile')
        media = models.MediaModel.get_by_key_name(name)

        if media is None or \
                (media.thumbnail is None and media.mobile is None and media.large is None):
            self.error(404)
            self.response.out.write('No image named: ' % name)
            return

        self.response.headers['Content-Type'] = 'image'
        if size == 'thumbnail':
            self.response.out.write(media.thumbnail)
        elif size == 'large' and media.large is not None:
            self.response.out.write(media.large)
        else:
            self.response.out.write(media.mobile)


class UploadHandler(UserHandler):
    @require_admin_login
    def post(self):
        filename = self.request.POST['img'].filename.split('.')[0]
        name = slugify(filename[:32])
        logging.info("name: %s", name)
        media = models.MediaModel.get_or_insert(name)
        image_data = self.request.get('img')

        image_object = images.Image(image_data)       # convert image to GAE image object for manipulation
        image_object._update_dimensions()             # make ._height and ._width accurate (not None)

        # scale image for different sizes, don't ever blow it up, large size not always produced
        if image_object._width > 960 or image_object._height > 960:
            large = images.resize(image_data, IMAGE_SIZE_LARGE, IMAGE_SIZE_LARGE, images.JPEG)
            media.large = large
        else:
            media.large = None

        if image_object._width > 480 or image_object._height > 480:
            mobile = images.resize(image_data, IMAGE_SIZE_MOBILE, IMAGE_SIZE_MOBILE, images.JPEG)
            media.mobile = mobile
        else:
            media.mobile = image_data

        thumbnail = images.resize(image_data, IMAGE_SIZE_THUMBNAIL, IMAGE_SIZE_THUMBNAIL, images.JPEG)
        media.thumbnail = thumbnail

        media.put()
        self.redirect('/admin#media')


def pretty_json(json_dict):
    return json.dumps(json_dict, sort_keys=True, indent=2,
                      separators=(',', ': '), cls=models.ModelEncoder)


reg_nonchar = re.compile(r"[^a-zA-Z0-9]")
reg_dashes = re.compile(r"[\-]+")
reg_outer_dashes = re.compile(r"(^-+)|(-+$)")

def slugify(s):
    """ Convert runs of all non-alphanumeric characters to single dashes. """
    s = reg_nonchar.sub('-', s).lower()
    s = reg_dashes.sub('-', s)
    s = reg_outer_dashes.sub('', s)
    return s
