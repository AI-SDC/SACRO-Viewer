import logging
import os

import uvicorn

from sacro.asgi import application


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

PORT = int(os.environ.get("PORT", "8000"))


def main():
    return uvicorn.run(application, host="127.0.0.1", port=PORT)


if __name__ == "__main__":
    main()
