# Administration Site

- Plugins with samples
  - qr-code generator (from shortCode)
  - showdown
  - image list
- Allow deletion of image.
X Link to AppEngine admin from our admin.
- Factor rest from admin.
- Form styles side-by-side (bootstrap class?)
- Checkbox style for boolean.
- Factor fields into own class.
- Support date parsing, boolean, select.


# Framework

- Factor all ajax calls into json-rest.js.
- Sign-in support for target app.
- Mobile page helpers
  - No scroll page
  - Sidebar?
- Build app.yaml from user customization file (e.g. dev name - not checked in)
- Enable depth-limited traversal of JSON data.
- Simplify PageHandler - remove package - all templates at top level (rename TemplateHanlder).
- Simplify app.yaml - all js/css at top level.
- remove add_models and implicitly add any subclass of RESTModel
- Why are read_only fields ignored now in admin?  (Bobby changed it?)

# Documentation

- Models
  - Admin field types.
  - Reference fields
- JSON api
  - Schema
  - Create
  - Read
  - Update
  - Delete

# Sample apps

- Show image list
- Include all field types (bool, number, text, long-text,).
- QR Code
- Showdown/markdown
- Touch/canvas demo
- Mobile screen size and orientation demo
- Bootstrap/mobile sample
- Todo:
  - Enable real-time updates.
  - Show owner of item?

# Documentation

- Scratch version of app w/o all the sample models.
- How to modify app
- Data URL's
- Admin docs (online help).


# Testing and Performance

- Combine and minimize JS and CSS
- Use memcache to retried rest_models -> datastore is slow
- Measure download time and download bytes
- Add qunit tests and python unit tests
  - Data access
- Windows and Mac installation
