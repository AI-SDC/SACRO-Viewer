import subprocess
import threading
import time

import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse


app = FastAPI()


@app.get("/")
async def root():
    html_content = """
    <html>
        <head>
            <title>Test ACRO app</title>
        </head>
        <body>
            <h1>Hello World!</h1>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


def run_chrome():
    time.sleep(1)  # TODO: wait until port responds
    # note: chrome.exe on windows
    subprocess.run(["google-chrome", "--app=http://127.0.0.1:8000"], check=True)


if __name__ == "__main__":
    t = threading.Thread(target=run_chrome)
    t.start()
    uvicorn.run(app, host="0.0.0.0", port=8000)

    # TODO handle app exit from either thread
