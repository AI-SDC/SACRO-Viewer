# Notes for developers

## Overview

The SACRO app consists of two parts:

1. a Django web app with vanilla JavaScript UI that renders a set of ACRO outputs for review
2. an Electron app and installer that bundles the web app

The web app is designed to be able to be used as normally deployed web
site. The electron app packages a pre-built version of this web app with a chrome
based browser.


- [System requirements](#system-requirements)
  - [Windows](#windows)
- [Local development environment](#local-development-environment)
- [Tests](#tests)
- [Test data](#test-data)
- [Running the electron app in dev mode](#running-the-electron-app-in-dev-mode)
  - [Testing the electron app](#testing-the-electron-app)
- [Building the application](#building-the-application)
  - [Building the python web app](#building-the-python-web-app)
  - [Building the electron GUI app](#building-the-electron-gui-app)
  - [Testing the built application](#testing-the-built-application)
- [Stack](#stack)
  - [Vite](#vite)
- [Links to built artefacts](#links-to-built-artefacts)


## System requirements for building

 - Python 3.10
 - [just](https://github.com/casey/just)
 - Node.js v20

### Windows specific build requirements

Windows is a bit trickier to get up and running.

Python 3.10: https://www.python.org/downloads/windows/ (recommend not using Microsoft Store version)
Node.js v20: https://github.com/Schniz/fnm
git-bash: https://gitforwindows.org/
just: `choco install just` (choco: https://chocolatey.org/)

Visual Studio Community w/C++ Desktop Development tools:

Download installer from: https://visualstudio.microsoft.com/downloads/
Then install, choosing the "Desktop Development with C++" workload.

Also recommended: Windows Terminal: https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701

You should reboot after installing all this, because Windows.

Note: just commands will only work inside git-bash shell by default, as they assume bash


## Local development environment

Run the Django devserver with:

```
just run
```

If you are making changes to the JavaScript you may wish to have the server auto-refresh so you get those changes without having to reload the page.
Make sure `DJANGO_VITE_DEV_MODE` is set in your environment and run the Vite devserver with:

```
just assets-run
```

## Tests

Run the tests with:

```
just test <args>
```

## Test data

The script `data/test-nursery.py` uses ACRO to generate outputs from a public test
dataset. These are automatically regenerated if needed by the `justfile` e.g. for `just test` or `just run`. The outputs are generated in the `outputs/` directory.

It can be run with the following command:

```
just test-outputs
```

However, this won't always pick up new changes. For example, if new files are
added to the test data. In this case it may be necessary to force removal
of all the test data and regenerate it, by doing the following.

```
just clean
just test-outputs
```

## Running the electron app in dev mode

First, run the development version of the python webapp and then run the
electron app pointing at that by setting the SACRO_URL env var.

```
just run &
export SACRO_URL=http://127.0.0.1:8000
just sacro-app/run
```

### Testing the electron app

Semi-automated testing can be done locally using Cypress, via spec files written in javascript.

Cypress expects a server to be running, so you'll need to have run `just run` before any of the following steps.

Then you can start running the tests using this command:

```
npm run cypress:open
```

Cypress can be run in headless mode, which could be used in CI in future. This automatically produces a video on each run and provides screenshots of any errors.

To run in headless mode:

```
npm run cypress:run
```

## Building the application

There are two stages to building the application for release. Firstly, building the executable
and then building the Windows installer (MSI).

### Building the python web app

```
just build
```

This builds the pyoxidizer binary of the python application for the current
platform. It can take a while. The build executable and supporting files can be
found in `build/$ARCH/release/install/sacro`.

### Building the electron GUI app

The root directory contains our python web service, and is similar to all our
other web services, but with the addition of the pyoxidizer.bzl build config,
and a `just build` command.

The `sacro-app` dir contains the electron and packaging config and tooling.

```
just sacro-app/build
```

This builds the installer, which can be found in `sacro-app/dist`

### Testing the built application

You can double click on the MSI, found in `sacro-app/dist`, to install it, which should also run it, opening
a file dialog. You may need to click various Windows dialogs to approve the
install.

Navigate to the `outputs` directory and choose `results.json`. You should
now be able to see the outputs rendered in the app.

You can click on the `Approve and Download` button to download the files.

## Stack

### Vite

This project uses [Vite](https://vitejs.dev/), a modern build tool and development server, to build the frontend assets.
Vite integrates into Django using [django-vite](https://github.com/MrBin99/django-vite).

Vite works by compiling JavaScript files, and outputs a manifest file, the JavaScript files, and any included assets such as stylesheets or images.

Vite adds all JavaScript files to the page using [ES6 Module syntax](https://caniuse.com/es6-module).
For legacy browsers, this project is utilising the [Vite Legacy Plugin](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) to provide a fallback using the [module/nomodule pattern](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/).

Vite is configured to build assets in `assets/src` and output them to `assets/dist`.
Django is configured to use `assets/dist` as a directory to collect static files from.

## Links to built artefacts

We use [nightly.link for GitHub](https://nightly.link/) as a redirect service to point users to the latest builds.

Windows: https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-windows-build.zip
MacOS: https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-macos-build.zip
Linux: https://nightly.link/AI-SDC/SACRO-Viewer/workflows/main/main/SACRO-latest-linux-build.zip
