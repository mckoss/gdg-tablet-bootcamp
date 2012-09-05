# GDG Seattle - Tablet/TV Web Application Sample

This material was created for:

- GDG Seattle / Startup Weekend Bootcamp - September 12, 2012, 6pm
- GDG Seattle DevFest - September 29-30, 2012, 9am - 5pm

Both events are being held at SURF Incubator (1st and Marion, 8th floor of the Exchange Building).


# Introduction

This course is designed to get you up and run with an HTML application (web-app)
that you can use to target desktop, mobile, tablet, and TV form factors.


## Prerequisites

Basic computer skills are all you need to complete the introductory parts of this course.  There is a lot
to learn to build a complete web application, but we've done much of the heavy lifting by providing this
working sample application.  If you can use a text editor on your computer to modify our application files,
you'll be able to "make it your own" and make a custom version of our sample app.

For the more advanced sections of this tutorial, you should have a working knowledge of HTML, CSS, and JavaScript.
Again, we have plenty of samples that show how we've solved the general problems, so you can focus on modifying
the app to make it do what you want it to.


## What You'll Do

1. Setup your development environment to build an [App Engine] application.
2. Deploy your application to Google's App Engine cloud hosting service.
3. Learn how a web app is built on App Engine (pages rendering and data storage).
4. Writing modular JavaScript code using namespaces.
5. Design an HTML app for different screen dimensions using [Twitter Bootstrap].
6. Make your app high performance by minifying and combining your client javascript code.
7. Package your web app so it can be run in offline mode - especially hanlding "sometimes connected"
   devices (application cache and offline storage).
8. Handle user authentication and sign-in (using Google accounts).
9. Define a "data model" for saving and retrieving information for your users.
10. Using [Backbone.js] to coordinate client side views and data.
11. Use client-side application navigation through use of the HTML "anchor" (#) url.


# What to Bring

You'll have the best expeience at our event if you are able to get a few things accomplished on your own
beforehand.  Don't worry if you don't get to it - we'll have people on site to help you get the preparation
work done and help you with any snags you may run in to; plan on reserving about an hour to get your
initial development environment configured.

Everyone needs to have a computer running Windows, Mac, or Linux.


# Setup Instructions

We distribute the source code for this application using the distributed source control system [Git]
and hosted on [GitHub].  You'll need to install [Git] and create an account on [GitHub], especially
if you want to work together with others on your project. If you would like a tutorial on using Git,
I recommend [Git Simple Guide] and [Git Tutorial].

- Install [Git for Windows](http://help.github.com/win-set-up-git/)
- Install [Git for Mac](http://help.github.com/mac-set-up-git/)
- Install [Git for Linux](http://help.github.com/linux-set-up-git/)

We've tried to make installation of your development environment simpler by providing a shell script
that you can run to install the various pre-requisites for your development environment.  In order to
use this script you need to be running Terminal (on Mac or Linux) or *Git Bash* (on Windows).

First, create your *own copy* of this repository by forking it on GitHub.

- Go to the [GDG DevFest Repository](https://github.com/mckoss/gdg-tablet-bootcamp).
- Click on the *Fork* button.

Now, you need to check out the files to your own machine.

Go to a directory where you want to install your project files (e.g., ~/src or c:\src).  Then use
the following commands (on Windows, you should run these command from the *Git Bash* shell,
not the windows command prompt):

    $ git clone git@github.com:<your-github-username>/gdg-tablet-bootcamp.git
    $ cd gtug-tablet-bootcamp
    $ git remote add upstream git://github.com/mckoss/gdg-tablet-bootcamp.git

The rest of your development machine configuration can be setup by running this command:

    $ bin/setup-machine.sh

This script will install (if you don't them already):

1. [Python 2.7]
2. [PIL] - Python image library.
2. [pip] - Python package installer (the *new* easy_install).
4. [Google App Engine]: Google's web application service (for Python).

*Note: If you want to merge any updates that have been made our master repository since you made your
fork, use the following commands:

    $ git fetch upstream
    $ git merge upstream/master

# Running the Todos application

You should now be able to run the sample application on your machine.

## Run Using the App Engine Launcher (Mac and Windows)

1. Run the Launcher App
2. File/Add Existing Application...
   - Select Path to: ~/src/gdg-tablet-bootcamp/app
   - Select Port: 8080
   - Click Add
3. Select your app in the list and click the Run button.
4. Open a web browser at address: http://localhost:8080

You should see the Todos application running in your browser!

## Run from command line (Mac and Linux)

Run the built-in development web server to run the app:

     $ dev_appserver.py app

Open your browser at http://localhost:8080 to view the application.

# Deploying your application to Google Appengine.

You can run your application at `http://<your-app-name>.appspot.com`.

1. Go to the [App Engine Admin Console]
2. Click the Create button.
   - You may be asked to verify your account via SMS ... do that.
   - Application identifier: `gdg-<your-name>` (e.g., "gdg-mckoss").
   - Application Title: "GDG Bootcamp Sample"
   - Click Create Application
3. Edit the file gdg-tablet-bootcamp/app/app.yaml:
   - Change `gdg-mckoss` to be `gdg-<your-name>`
4. Deploy your application.
   - Open the App Engine Luancher
   - Select your app.
   - Click the Deploy button.
   - Enter your Google Account credentials.
   - Wait until "Completed update of app:" message.
5. Visit `http://gdg-<your-name>.appspot.com`

Alternatively, you can deploy via the command line via:

    $ appcfg.py update app

Note: If you get an error "AttributeError: can't set attribute" you are probably not authenticating
properly.  If you use two-factor authentication for your Google account, you will have to create
an [application specific password] and use that to deploy to AppEngine.

You can view an online version of the app at http://gdg-mckoss.appspot.com/

  [GitHub]: https://github.com/
  [App Engine]: http://code.google.com/appengine/
  [Backbone.js]: http://documentcloud.github.com/backbone/
  [jQuery]: http://jquery.com/
  [Namespace.js]: https://github.com/mckoss/namespace
  [QUnit]: https://github.com/jquery/qunit

  [Git Tutorial]: http://gitimmersion.com/index.html
  [Git Simple Guide]: http://rogerdudler.github.com/git-guide/
  [Python 2.7]: http://www.python.org/getit/releases/2.7.3/
  [pip]: http://pypi.python.org/pypi/pip
  [PIL]: http://www.pythonware.com/products/pil/
  [Google App Engine]: http://code.google.com/appengine/docs/python/overview.html

  [App Engine Admin Console]: https://appengine.google.com/
  [application specific password]: https://accounts.google.com/b/2/IssuedAuthSubTokens

  [Android Design]
  [Google TV]
