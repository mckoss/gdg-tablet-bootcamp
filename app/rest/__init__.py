import views
from views import AdminPageHandler  # from SC replacing:
# from MM  from views import get_template_handler

import models


def using(template_name, render_data=None):
    return AdminPageHandler.using(template_name, render_data, package='rest')


def get_paths():
    return [
        # REST views
        ('/data/(\w+)', views.ListHandler),
        ('/data/(\w+)/(\d+)', views.ItemHandler),
        ('/data', views.SchemaHandler),

        # Admin views
        ('/admin', using('admin.html')),
        # TODO       ('/admin/help', using('help.html')),
        ('/admin/forms', using('main-form.html',
                               {'models': models.rest_models.keys()})),
        ('/admin/media', views.MediaListHandler),
        ('/admin/forms/(\w+)', using('list-form.html')),
        ('/admin/forms/(\w+)/(\d+)', using('item-form.html')),
        ('/admin/media/([a-zA-Z0-9_\-\.]+)', views.MediaHandler),
        ('/image-upload', views.UploadHandler),
        ]
