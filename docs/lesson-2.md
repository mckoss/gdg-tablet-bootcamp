# Lesson 2 - ToDo Sample Application - The Server Side

In this lesson, we'll:

1. Learn how a web app is built on App Engine (page rendering and data storage).
2. Define a "data model" for saving and retrieving information for your users.
3. Using the Admin interface.
4. The data interface - JSON/REST.

# App Engine - Building a Web App

App Engine provides a very simple model for building a web application. You do not have to
install or configure a web server or a database; it's a "batteries included" appliction
framework that makes it easy for you to define your application and data, while it takes care
of the details of efficiently hosting your code, files, and data.

We'll be using the simplest App Engine framework, the [[Web App Framework] written for the
Python programming lanaguage (you can also program App Engine in Java or Go, but those
languages are beyond the scope of this lesson).

A general web application has to do a few basic things:

- Serve static files that are hosted on your site (generally, images, javascript, css and some
  html files).
- Receive HTTP requests and figure out what code to run for each URL of your site.
- Access a database to look up information requested by the user.
- Render html pages my combining templates with custom data.

## Rendering Static Files

The app.yaml file tell App Engine which files you want to upload to their static file hosting service.  For
example:

    - url: /images
      static_dir: images

tells App Engine to copy all the files in the images directory of our application and serve
them for any URL begining with /images (e.g. http://gdg-mckoss.appspot.com/images/logo.png).
You generally will not have to change the app.yaml file if you put all your static files in
/images, /css, or /js.

## Rendering dynamic HTML files

Most of your HTML files are customized for each user and visitor in some way. We tell App
Engine (in app.yaml) that all URL's not delivered statically, are to be rendered by the program
called 'app' in our main.py file:

    - url: /.*
      script: main.app

Just a few lines in main.py tell App Engine how to run our application and dispatch URLs:

    paths = [
        ('/', PageHandler.params('index.html')),
        ]

    app = webapp.WSGIApplication(paths, debug=settings.DEBUG)

This application has a single URL pattern, '/' (i.e., the root of the domain, http://gdg-tablet/),
which is rendered by running a Request Handler called PageHandler.  A page handler generatates HTML
by reading a template file, and applying variables from your program, much like a form letter is
generated from a template and a database.

For our purposes, you may never have to write a template file or render pages on the server side, since
our application is primarily executed on the client, and uses the server to retrieve data and static
html files.

## Database Models

App Engine databases are accessed through Models.  Each Model defines a collection of properties that
you want to associate together.  Models can be read, written, and queried to retrieve collections of
data that match a particular criteria (called filters).

A simple App Engine model for our ToDo application could be:

    class ToDo(db.Model):
        text = db.StringProperty()
        done = db.BooleanProperty()
        order = db.IntegerProperty()

To create a new to-do item:

    # Create a new ToDo item.
    my_todo = ToDo(text="a sample todo", done=False, order=1)
    # Write it to the database.
    my_todo.put()

To get the list of first 100 to-do's:

    all_todos = ToDo.all().fetch(100)

But, since we're going to put most of our application logic in client-side JavaScript, you will not
generally have to write any code to query models on the server.  We instead use a type of Model called
RESTModel (unique to this lesson framework).

## REST Models

We use a variant of the App Engine Model to define a special version of our Models:

    class Todo(RESTModel, Timestamped):
        text = db.StringProperty()
        done = db.BooleanProperty()
        order = db.IntegerProperty()

A RESTModel adds the capability to:

    - Support a [REST] interface to the backend database.
    - Describe its own schema to the JavaScript client.

For example, we retrieve all the todos in the database via an (ajax) request to
http://localhost:8080/data/todo:

    [
      {
        "created": 1346775918000,
        "done": false,
        "id": 1,
        "modified": 1346775918000,
        "name": null,
        "order": 1,
        "owner_email": "anonymous",
        "text": "hello"
      },
      {
        "created": 1346775919000,
        "done": false,
        "id": 2,
        "modified": 1346775919000,
        "name": null,
        "order": 2,
        "owner_email": "anonymous",
        "text": "world"
      }
    ]

While a single todo can be fetched by a request to http://localhost:8080/data/todo/1:

    {
      "created": 1346775918000,
      "done": false,
      "id": 1,
      "modified": 1346775918000,
      "name": null,
      "order": 1,
      "owner_email": "anonymous",
      "text": "hello"
    }

These JSON-formatted responses can be read by JavaScript for processing in the client.

Similarly, we can use the HTTP verbs PUT, POST, and DELETE (from JavaScript) to update,
create, and delete items in the to-do list.

The REST interface gives us the full set of "CRUD" commands:

    Create - POST to /data/todo
    Request - GET to /data/todo/id
    Update - PUT to /data/todo/id
    Delete - DELETE to /data/todo/id

  [Web App Framework]