# Notes for developers

## System requirements

### Windows

Python 3.10: https://www.python.org/downloads/windows/
git-bash: https://gitforwindows.org/
just: `choco install just` (choco: https://chocolatey.org/)

Visual Studio Community w/C++ Desktop Development tools:

Download installer from: https://visualstudio.microsoft.com/downloads/
Then install, choosing the "Desktop Development with C++" workload.

Also recommended: Windows Terminal: https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701

You should reboot after installing all this, because windows.

Note: just commands will only work inside git-bash shell by default, as they assume bash

## Local development environment

Set up a local development environment with:
```
just devenv
```

## Tests
Run the tests with:
```
just test <args>
just run  # run python server
```


## Building the python web app

```
just build
```

This builds the pyoxidizer binary of the python application for the current platform.


## Building the electron GUI app

The root directory contains our python web service, and is basically the same
as all our other web services, but with pyoxidizer.bzl build config, and a
`just build` command.

The sacro-app dir contains the electron and packaging config and tooling

```
just sacro-app/build
```


