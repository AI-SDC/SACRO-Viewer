"""
Django settings for sacro project.

Generated by 'django-admin startproject' using Django 4.1.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""
import os
from pathlib import Path

from environs import Env

from .logging import logging_config_dict


env = Env()
env.read_env()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env.str("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool("DEBUG", default=False)

ALLOWED_HOSTS = ["*"]


# Application definition

INSTALLED_APPS = [
    "sacro",
    "django_extensions",
    "django_vite",
    "slippers",
    # "django.contrib.auth",
    # "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

MIDDLEWARE = [
    "sacro.middleware.AppTokenMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    # "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"
SESSION_COOKIE_HTTPONLY = True

# add dev tools only when needed
if DEBUG:  # pragma: no cover
    import importlib.util

    if importlib.util.find_spec("django_browser_reload"):
        INSTALLED_APPS.insert(0, "django_browser_reload")
        MIDDLEWARE.append("django_browser_reload.middleware.BrowserReloadMiddleware")


ROOT_URLCONF = "sacro.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "sacro" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                # "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
            "builtins": [
                "slippers.templatetags.slippers",
            ],
        },
    },
]

# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-gb"


TIME_ZONE = "UTC"

USE_I18N = False

USE_TZ = True

# Logging
LOGGING = logging_config_dict

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# this is used by the electron app to configure a random secret token that must
# be present in requests, to avoid localhost interception
APP_TOKEN = os.environ.get("SACRO_APP_TOKEN")

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/
STATICFILES_DIRS = [
    str(BASE_DIR / "static"),
    str(env.path("BUILT_ASSETS", default=BASE_DIR / "assets" / "dist")),
]
# we put staticfiles inside the python module, so that its easy to bundle with pyoxidizer
STATIC_ROOT = env.path("STATIC_ROOT", default=BASE_DIR / "sacro/staticfiles")
STATIC_URL = "/static/"

DJANGO_VITE_ASSETS_PATH = BASE_DIR / "assets" / "dist"
DJANGO_VITE_DEV_MODE = env.bool("DJANGO_VITE_DEV_MODE", default=False)
DJANGO_VITE_DEV_SERVER_PORT = 5173
DJANGO_VITE_MANIFEST_PATH = STATIC_ROOT / "manifest.json"

# Insert Whitenoise Middleware.
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"
