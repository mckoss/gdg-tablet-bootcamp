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

### Lesson 1 - Seting up your Development Environment and Deploying to App Engine

1. Setup your development environment to build an [App Engine] application.
2. Deploy your application to Google's App Engine cloud hosting service.

### Lesson 2 - ToDo Sample Application - The Server Side

1. Learn how a web app is built on App Engine (page rendering and data storage).
2. Define a "data model" for saving and retrieving information for your users.
3. Using the Admin interface.
4. The data interface - JSON/REST.

### Lesson 3 - ToDo Sample Application - HTML Client Application

1. Writing modular JavaScript code using namespaces.
2. Using [Backbone.js] to coordinate client side views and data.
3. User authentication and sign-in (using Google accounts).

### Lesson 4 - TBD - Advanced HTML web app

1. Use client-side application navigation through use of the HTML "anchor" (#) url.
2. Design an HTML app for different screen dimensions using [Twitter Bootstrap].
3. Make your app high performance by minifying and combining your client javascript code.
4. Package your web app so it can be run in offline mode - especially hanlding "sometimes connected"
   devices (application cache and offline storage).


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

For Linux users, installing the development environment involves simply running a shell script to
gather and install all of the dependencies.  Windows and Mac users must install the pre-requisites
manually.

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


## Mac

1. A version of Python 2.7 is installed by default on Mac OS/X.
2. Go to [App Engine SDK] for Python and download GoogleAppEngineLauncher-1.7.1.dmg.
3. Open the dmg file and drag the GoogleAppEngineLauncher icon to your Application folder.
4. Run the program from Applications folder.  Click "OK" when asked to create Symlinks.
4. sudo easy_install pip
5. Install [PIL] for Image processing support:
   - You can get full support for image manipulation on the server.  This is easiest
     if you have a package manager on your Mac like [Homebrew] or [Mac Ports].
     This [Stack Overflow)[http://stackoverflow.com/questions/8404956/installing-pil-with-jpeg-support-on-mac-os-x]
     article is helpful.  I prefer [Mac Ports]:
   - $ sudo port install py27-pil # This installs all dependencies and PIL into python2.7 including in ports!
   - $ sudo pip install PIL # This will install PIL into Apple's default Python (yes you have multiple versions of Python on
     your machine).


## Windows

1. Python 2.7.3
   - Go to [Python.org]
   - Click on "Python 2.7.3 Windows Installer (Windows binary -- does not include source)"
   - Run the installer, let it install to the default location, C:\python27
        If you must change the location (not recommended), take note of where it goes
2. Add Python to path
   - Hold windows key and press pause (Or go Control Panel->System and Security->System)
   - Click on the link labeled "Advanced System Settings" on the sidebar
   - Click on the button "Environment Variables" at the bottom
   - Under "System Variables" find the variabled called "Path"
   - Click on path and press Edit.
   - Append ";C:\python27" (no quotes) to the end of the Path variable (or your python path)
3. PIL
   - Go to [PIL]
   - Click on the link for "Python Imaging Library 1.1.7 for Python 2.7 (Windows only)"
   - Run the installer
5. Google App Engine
   - Go to [App Engine SDK for Python].
   - Download "GoogleAppEngine-1.7.1.msi" for Windows
   - Run the installer

## Linux

Run the following command

    $ bin/make-env.sh

This script will install (if you don't them already):

1. [Python 2.7]
2. [pip] - Python package installer (the *new* easy_install).
3. [Google App Engine]: Google's web application service (for Python).

Next run

    $ sudo apt-get install python-dev
    $ pip install PIL

*Note: If you want to merge any updates that have been made to our master repository since you made your
fork, use the following commands:

    $ git fetch upstream
    $ git merge upstream/master

# Running the Application

You should now be able to run the sample application on your machine.

## Run Using the App Engine Launcher (Mac and Windows)

1. Run the Launcher App
2. File/Add Existing Application...
   - Select Path to: ~/src/gdg-tablet-bootcamp/app
   - Select Port: 8080
   - Click Add
3. Select your app in the list and click the Run button.
4. Open a web browser at address: http://localhost:8080
5. Test if image uploading is working by visiting http://localhost:8080/admin/media

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

You can view an online version of the app at http://gdg-tablet.appspot.com/

  [GitHub]: https://github.com/
  [App Engine]: http://code.google.com/appengine/
  [Backbone.js]: http://documentcloud.github.com/backbone/
  [jQuery]: http://jquery.com/
  [Namespace.js]: https://github.com/mckoss/namespace
  [QUnit]: https://github.com/jquery/qunit

  [Git Tutorial]: http://gitimmersion.com/index.html
  [Git Simple Guide]: http://rogerdudler.github.com/git-guide/
  [Python.org] http://www.python.org/download/
  [Python 2.7]: http://www.python.org/getit/releases/2.7.3/
  [pip]: http://pypi.python.org/pypi/pip
  [PIL]: http://www.pythonware.com/products/pil/
  [Google App Engine]: http://code.google.com/appengine/docs/python/overview.html
  [App Engine SDK]: https://developers.google.com/appengine/downloads#Google_App_Engine_SDK_for_Python

  [App Engine Admin Console]: https://appengine.google.com/
  [application specific password]: https://accounts.google.com/b/2/IssuedAuthSubTokens

  [Android Design]: http://developer.android.com/design/index.html
  [Google TV]: https://developers.google.com/tv/

  [Homebrew]: http://mxcl.github.com/homebrew/
  [Mac Ports]: http://www.macports.org/