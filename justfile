build_target := if os_family() == "windows" {
  "pc-windows-msvc"
} else {
  if os() == "macos" {
    "apple-darwin"
  } else {
    "unknown-linux-gnu"
  }
}
export BUILD_TARGET := build_target

# just has no idiom for setting a default value for an environment variable
# so we shell out, as we need VIRTUAL_ENV in the justfile environment

DEFAULT_VENV_NAME := if os_family() == "unix" { ".venv" } else { ".wenv" }
export VIRTUAL_ENV := env_var_or_default('VIRTUAL_ENV', DEFAULT_VENV_NAME)

export BIN := VIRTUAL_ENV + if os_family() == "unix" { "/bin" } else { "/Scripts" }
export PIP := BIN + if os_family() == "unix" { "/python -m pip" } else { "/python.exe -m pip" }

# Note: we'd use python 3.11 if we could, but its not yet supported by pyoxidizer
export DEFAULT_PYTHON := if os_family() == "unix" { "python3.10" } else { "py -3.10" }


# list available commands
default:
    @"{{ just_executable() }}" --list


# clean up temporary files
clean: assets-clean
    rm -rf .venv .wenv
    rm -f outputs/*


# ensure valid virtualenv
virtualenv: _env
    #!/usr/bin/env bash
    # allow users to specify python version in .env
    PYTHON_VERSION=${PYTHON_VERSION:-$DEFAULT_PYTHON}

    # create venv and upgrade pip
    test -d $VIRTUAL_ENV || { $PYTHON_VERSION -m venv $VIRTUAL_ENV && $PIP install --upgrade pip; }

    # ensure we have pip-tools so we can run pip-compile
    test -e $BIN/pip-compile || $PIP install pip-tools


_env:
    #!/usr/bin/env bash
    test -f .env || cp .dotenv-sample .env


_compile src dst *args: virtualenv
    #!/usr/bin/env bash
    # exit if src file is older than dst file (-nt = 'newer than', but we negate with || to avoid error exit code)
    test "${FORCE:-}" = "true" -o {{ src }} -nt {{ dst }} || exit 0
    $BIN/pip-compile --allow-unsafe --output-file={{ dst }} {{ src }} {{ args }}


# update requirements.prod.txt if requirements.prod.in has changed
requirements-prod *args:
    "{{ just_executable() }}" _compile requirements.prod.in requirements.prod.txt {{ args }}


# update requirements.dev.txt if requirements.dev.in has changed
requirements-dev *args: requirements-prod
    "{{ just_executable() }}" _compile requirements.dev.in requirements.dev.txt {{ args }}


# ensure prod requirements installed and up to date
prodenv: requirements-prod
    #!/usr/bin/env bash
    # exit if .txt file has not changed since we installed them (-nt == "newer than', but we negate with || to avoid error exit code)
    test requirements.prod.txt -nt $VIRTUAL_ENV/.prod || exit 0

    $PIP install -r requirements.prod.txt
    touch $VIRTUAL_ENV/.prod


# && dependencies are run after the recipe has run. Needs just>=0.9.9. This is
# a killer feature over Makefiles.
#
# ensure dev requirements installed and up to date
devenv: prodenv requirements-dev && install-precommit
    #!/usr/bin/env bash
    # exit if .txt file has not changed since we installed them (-nt == "newer than', but we negate with || to avoid error exit code)
    test requirements.dev.txt -nt $VIRTUAL_ENV/.dev || exit 0

    $PIP install -r requirements.dev.txt
    touch $VIRTUAL_ENV/.dev


# ensure precommit is installed
install-precommit:
    #!/usr/bin/env bash
    BASE_DIR=$(git rev-parse --show-toplevel)
    test -f $BASE_DIR/.git/hooks/pre-commit || $BIN/pre-commit install


# upgrade dev or prod dependencies (specify package to upgrade single package, all by default)
upgrade env package="": virtualenv
    #!/usr/bin/env bash
    opts="--upgrade"
    test -z "{{ package }}" || opts="--upgrade-package {{ package }}"
    FORCE=true "{{ just_executable() }}" requirements-{{ env }} $opts


# *args is variadic, 0 or more. This allows us to do `just test -k match`, for example.
# Run the tests
test *args: devenv test-outputs
    $BIN/coverage run --module pytest {{ args }}
    $BIN/coverage report || $BIN/coverage html


test-e2e: devenv test-outputs
    npm run cypress:run


test-cypress: devenv test-outputs
    npm run cypress:open


black *args=".": devenv
    $BIN/black --check {{ args }}

ruff *args=".": devenv
    $BIN/ruff check {{ args }}

# run the various dev checks but does not change any files
check: black ruff
    npm run lint


# fix formatting and import sort ordering
fix: devenv assets-install
    $BIN/black .
    $BIN/ruff --fix .
    npm run lint:fix


# Run the dev project
run: devenv collectstatic test-outputs
    $BIN/python manage.py migrate
    $BIN/python manage.py runserver

build: collectstatic
    $BIN/pyoxidizer build --release

eslint:
    npm run lint

# Install the Node.js dependencies
assets-install:
    #!/usr/bin/env bash
    set -eu

    # exit if lock file has not changed since we installed them. -nt == "newer than",
    # but we negate with || to avoid error exit code
    test package-lock.json -nt node_modules/.written || exit 0

    npm ci
    touch node_modules/.written

# Remove built assets and collected static files
assets-clean:
    rm -rf assets/dist
    rm -rf staticfiles

# Build the Node.js assets
assets-build: assets-install
    #!/usr/bin/env bash
    set -eu

    # find files which are newer than dist/.written in the src directory. grep
    # will exit with 1 if there are no files in the result.  We negate this
    # with || to avoid error exit code
    # we wrap the find in an if in case dist/.written is missing so we don't
    # trigger a failure prematurely
    if test -f assets/dist/.written; then
        find assets/src -type f -newer assets/dist/.written | grep -q . || exit 0
    fi

    npm run build
    touch assets/dist/.written


assets: assets-build

assets-rebuild: assets-clean assets

assets-run: assets-install
  #!/usr/bin/env bash

  if [ "$DJANGO_VITE_DEV_MODE" == "False" ]; then
      echo "Set DJANGO_VITE_DEV_MODE to a truthy value to run this command"
      exit 1
  fi
  npm run dev

# Ensure django's collectstatic is run if needed
collectstatic: devenv assets
    ./scripts/collect-me-maybe.sh $BIN/python


test-data:
    #!/usr/bin/env bash
    if test -f data/dataset_26_nursery.arff; then exit 0; fi
    curl https://www.openml.org/data/download/26/dataset_26_nursery.arff -\o data/dataset_26_nursery.arff

test-outputs: test-data devenv
    #!/usr/bin/env bash
    if test outputs/results.json -nt data/test-nursery.py; then exit 0; fi
    # ACRO is additive by default, so delete before regenerating
    rm -rf outputs/*
    $BIN/python data/test-nursery.py
