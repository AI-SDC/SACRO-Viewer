# Notes for developers

## System requirements

### just

```sh
# macOS
brew install just

# Linux
# Install from https://github.com/casey/just/releases

# Add completion for your shell. E.g. for bash:
source <(just --completions bash)

# Show all available commands
just #  shortcut for just --list
```


## Local development environment


Set up a local development environment with:
```
just devenv
```

## Tests
Run the tests with:
```
just test <args>
```


## Building the python web app

```
just build
```

This builds the pyoxidizer binary of the python application for the current platform.

## Building the electron GUI app

```
just sacro-app/build
```


