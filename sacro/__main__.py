import logging
import os

import uvicorn


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

PORT = int(os.environ.get("PORT", "8000"))


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sacro.settings")

    from sacro.asgi import application

    return uvicorn.run(application, host="127.0.0.1", port=PORT)


if __name__ == "__main__":
    main()
