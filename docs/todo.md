# Mobile Site

- Header should be white on black (or other MOF-based design)
- Read from database, not hard coded
- Factor out slide show to namespace module
- Images list parsing
- Map list parsing
- Migrate to pull standard html (markdown-generated) for page content.
- Track user with cookies
- Add favicon (static)
- Encapsulate get/put/create/delete (mini ORM) in json-rest - don't do direct ajax in forms.

# Testing and Performance

- Combine and minimaize JS and CSS
- Use memcache to retried rest_models -> datastore is slow
- Measure download time and download bytes
- Add qunit tests

# Framework

- Factor all ajax calls into json-rest.js.


# Administration Site

- Ensure permissions only allow admin users to edit.
- Publish to AppEngine
- Image model (with image upload)
- Use bootstrap css
- qr-code generator (from shortCode)

- /admin - Admin home - usage stats, etc.
- /admin/forms/ - List all model types
- /admin/forms/model - List of instances for editing and New (generic)
- /admin/forms/model/id - Display/edit instance
