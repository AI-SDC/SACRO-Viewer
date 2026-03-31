# Build stage for frontend assets
FROM node:18-bullseye AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install

COPY assets ./assets
COPY tailwind.config.js postcss.config.cjs vite.config.js ./

COPY sacro/templates ./sacro/templates

RUN npm run build

# Production stage
FROM python:3.10-slim


ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=sacro.settings \
    STATIC_ROOT=/app/staticfiles \
    DJANGO_VITE_DEV_MODE=False

WORKDIR /app

# Create a non-root user
RUN addgroup --system sacro && \
    adduser --system --ingroup sacro --home /home/sacro sacro


COPY requirements.prod.txt ./

RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.prod.txt

COPY sacro ./sacro
COPY manage.py ./

COPY static ./static

COPY --from=frontend-builder /app/assets/dist ./assets/dist

COPY data ./data

RUN SECRET_KEY=build-only python manage.py collectstatic --noinput --clear && \
    chown -R sacro:sacro /app
USER sacro

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/').read()" || exit 1

CMD ["uvicorn", "sacro.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
