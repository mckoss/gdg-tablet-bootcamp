# Administration Site

- Plugins with samples
  - qr-code generator (from shortCode)
  - showdown
  - image list
- Allow deletion of image.
- Link to AppEngine admin from our admin.


# Framework

- Factor all ajax calls into json-rest.js.
- Sign-in support for target app.
- Mobile page helpers
  - No scroll page
  - Sidebar?
- Build app.yaml from user customization file (e.g. dev name - not checked in)


# Sample apps

- Show image list
- QR Code
- Showdown/markdown
- Mobile screen size and orientation demo
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
- Add qunit tests
- Windows and Mac installation
