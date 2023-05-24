import logging
import os

import uvicorn
from fastapi import Cookie, FastAPI, HTTPException
from fastapi.responses import HTMLResponse


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
app = FastAPI()
ENV_TOKEN = os.environ.get("SACRO_APP_TOKEN")
PORT = int(os.environ.get("PORT", "8000"))

if ENV_TOKEN:
    logger.info("running with SACRO_APP_TOKEN")


@app.get("/")
async def root(sacro_app_token: str | None = Cookie(default=None)):
    if ENV_TOKEN:
        if sacro_app_token != ENV_TOKEN:
            raise HTTPException(403, "Not Allowed")

    html_content = """
    <html>
        <head>
            <title>SACRO Outputs Viewer</title>
        </head>
        <body>
            <h1>Hello World!</h1>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


def main():
    return uvicorn.run(app, host="127.0.0.1", port=PORT)


if __name__ == "__main__":
    main()
