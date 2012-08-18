import os
import sys
import logging
import simplejson as json
import traceback

from google.appengine.api import users
from google.appengine.ext import webapp, db
from google.appengine.ext.webapp import template
from google.appengine.api import images

import settings

import models

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
        self.response.out.write(pretty_json(json_dict))


class SchemaHandler(UserHandler, JSONHandler):
    def get(self):
        results = {'schema': {}}
        for model_name, model in models.rest_models.items():
            results['schema'][model_name] = model.get_schema()
        self.json_response(results)


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

        should_cache = True

        for property_name in self.request.arguments():
            value = self.request.get(property_name)
            if property_name == 'no-cache':
                should_cache = False
                continue
            if '*' == value[-1]:
                filter_query_by_prefix(query, model, property_name, value[:-1])
            else:
                filter_query_by_value(query, model, property_name, value)

        results = query.fetch(1000)
        logging.info("Found [%i] %s's" % (len(results), model_name))
        items = [item.get_dict() for item in results]
        self.json_response(items, cache=should_cache)

    # create an item
    def post(self, model_name):
        model = self.get_model(model_name)
        if model is None:
            return
        """
        # FROM HERE
        # HACK - How else to initialize properties ONLY in the case
        # where a model is being created.
        if hasattr(model, 'set_defaults'):
            model.set_defaults()

        data = json.loads(self.request.body)
        item = model(user_id=self.user_id)
        item.set_dict(data)
        item.put()
        json_response(self.response, item.get_dict())
        #TO HERE IS DIFFERENT IN SC HERE IT IS:
        """

        # HACK - How else to initialize properties ONLY in the case
        # where a model is being created.
        data = json.loads(self.request.body)
        item = model(owner_email=self.user_email)

        if hasattr(item, 'set_defaults'):
            item.set_defaults()

        item.set_dict(data)
        item.put()
        self.json_response(item.get_dict())


class ItemHandler(UserHandler, JSONHandler):
    def get(self, model_name, id):
        item = self.get_item(model_name, id)
        if not item:
            return
        self.json_response(item.get_dict())

    def get_item(self, model_name, id):
        if model_name not in models.rest_models:
            self.error(404)
            self.response.out.write("No such model: %s." % model_name)
            return None
        model = models.rest_models[model_name]
        item = model.get_by_id(int(id))
        if item is None:
            self.error(404)
            self.response.out.write("No such model: %s[%s]." % (model_name, id))
            return None
        return item

    def put(self, model_name, id):
        logging.info("called put")
        item = self.get_item(model_name, id)
        if not item:
            return

        data = json.loads(self.request.body)
        if not item.can_write(user_email=self.user_email):
            self.error(403)
            self.response.out.write("Write permission failure.")
            return

        item.set_dict(data)
        item.put()
        self.json_response(item.get_dict())

    def delete(self, model_name, id):
        item = self.get_item(model_name, id)
        if item:
            item.delete()


class MediaListHandler(UserHandler):
    @require_admin_login
    def get(self):
        username = self.user and self.user.nickname()
        render_data = {
            'images': models.MediaModel.all(),
            'sign_in': users.create_login_url('/'),
            'sign_out': users.create_logout_url('/'),
            'username': username,
            'site_name': settings.SITE_NAME,
            'debug': settings.DEBUG
        }
        result = template.render('rest/templates/media-upload.html', render_data)
        self.response.out.write(result)


class MediaHandler(webapp.RequestHandler):
    def get(self, name):
        size = self.request.get('size', 'mobile')
        media = models.MediaModel.get_by_key_name(name)

        if media is None or \
                (media.thumbnail is None and media.mobile is None and media.large is None):
            self.response.out.write('no image found')
            return

        self.response.headers['Content-Type'] = 'image'
        if size == 'thumbnail':
            self.response.out.write(media.thumbnail)
        elif size == 'large' and media.large is not None:
            self.response.out.write(media.large)
        else:
            self.response.out.write(media.mobile)


class UploadHandler(webapp.RequestHandler):
    def post(self):
        model = models.MediaModel.get_or_insert(self.request.get('img_name'))
        image_data = self.request.get('img')

        image_object = images.Image(image_data)       # convert image to GAE image object for manipulation
        image_object._update_dimensions()             # make ._height and ._width accurate (not None)

        # scale image for different sizes, don't ever blow it up, large size not always produced
        if image_object._width > 960 or image_object._height > 960:
            large = images.resize(image_data, IMAGE_SIZE_LARGE, IMAGE_SIZE_LARGE, images.JPEG)
            model.large = large
        else:
            model.large = None

        if image_object._width > 480 or image_object._height > 480:
            mobile = images.resize(image_data, IMAGE_SIZE_MOBILE, IMAGE_SIZE_MOBILE, images.JPEG)
            model.mobile = mobile
        else:
            model.mobile = image_data

        thumbnail = images.resize(image_data, IMAGE_SIZE_THUMBNAIL, IMAGE_SIZE_THUMBNAIL, images.JPEG)
        model.thumbnail = thumbnail

        model.put()
        self.redirect('/admin/media')


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


class PageHandler(UserHandler):
    """ Request handler for generic pages for webapp views.
    Usage: PageHandler.using("template-name.html"). """
    def __init__(self, template_path, render_data=None):
        super(PageHandler, self).__init__()
        self.template_path = template_path
        self.render_data = render_data or {}

    @classmethod
    def using(cls, template_name, render_data=None, package=None):
        """ Factory function to create a PageHandler instance to be used
        as a Handler callable. """
        import pdb; pdb.set_trace()
        def factory(*args, **kwargs):
            path = ['templates', template_name]
            if package is not None:
                path.insert(0, package)
            return cls(os.path.join(*path), render_data=render_data)
        return factory

    def prepare(self):
        username = self.user and self.user.nickname()
        self.render_data.update({
            'sign_in': users.create_login_url('/'),
            'sign_out': users.create_logout_url('/'),
            'username': username,
            'site_name': settings.SITE_NAME,
            'debug': settings.DEBUG
        })

    def get(self, *args):
        self.prepare()
        if settings.DEBUG:
            import pprint
            logging.info("Rendering template: %s" % self.template_path)
            logging.info("render_data:\n%s", pprint.pformat(self.render_data))
        result = template.render(self.template_path, self.render_data)
        self.response.out.write(result)


class AdminPageHandler(PageHandler):
    @require_admin_login
    def get(self, *args):
        super(AdminPageHandler, self).get(*args)


def pretty_json(json_dict):
    return json.dumps(json_dict, sort_keys=True, indent=2,
                      separators=(',', ': '), cls=models.ModelEncoder)
