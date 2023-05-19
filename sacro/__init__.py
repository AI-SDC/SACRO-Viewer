
import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse


app = FastAPI()


@app.get("/")
async def root():
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
    return uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
