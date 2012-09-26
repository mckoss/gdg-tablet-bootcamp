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
        ('/media', MediaListHandler),
        ('/media/([a-zA-Z0-9_\-\.]+)', views.MediaHandler),
        ('/admin/image-upload', views.UploadHandler),
        ]
