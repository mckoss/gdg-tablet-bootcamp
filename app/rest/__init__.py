import views
from views import AdminPageHandler, MediaListHandler

import models


def using(template_name, **kwargs):
    return AdminPageHandler.params(template_name, package='rest', app='admin', **kwargs)


def get_paths():
    return [
        # REST views
        ('/data/(\w+)', views.ListHandler),
        ('/data/(\w+)/(\d+)', views.ItemHandler),
        ('/data', views.SchemaHandler),

        # Admin views
        ('/admin', using('admin.html')),
        ('/admin/help', using('help.html')),
        ('/admin/forms', using('main-form.html',
                               models=models.rest_models.keys())),
        ('/admin/forms/(\w+)', using('list-form.html')),
        ('/admin/forms/(\w+)/(\d+)', using('item-form.html')),

        ('/admin/media', MediaListHandler.params('media-upload.html', package='rest', app='admin')),
        ('/admin/media/([a-zA-Z0-9_\-\.]+)', views.MediaHandler),
        ('/admin/image-upload', views.UploadHandler),
        ]
