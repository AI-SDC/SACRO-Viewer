# Notes for developers

## System requirements

### Windows

Python 3.10: https://www.python.org/downloads/windows/
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

Set up a local development environment with:
```
just devenv
just assets
```

## Tests
Run the tests with:
```
just test <args>
just run  # run python server
```

## Test data

The script `data/test-nursery.py` uses ACRO to generate outputs from a public test
dataset. It will generate some test outputs in `outputs/`.

It can be run with the following command:

```
just test-outputs
```

## Running the electon app

You can run the development version the python webapp and then run the electron
app pointing at that by setting the SACRO_URL env var.

```
just run &
export SACRO_URL=http://localhost:8000
just sacro-app/run
```

## Building the application

There are two stages to building the application for release. Firstly, building the executable
and then building the Windows installer (MSI).

### Building the python web app

```
just build
```

This builds the pyoxidizer binary of the python application for the current platform.

### Building the electron GUI app

The root directory contains our python web service, and is basically the same
as all our other web services, but with pyoxidizer.bzl build config, and a
`just build` command.

The sacro-app dir contains the electron and packaging config and tooling

```
just sacro-app/build
```
