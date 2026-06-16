FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN groupadd --gid 1000 corelasi \
    && useradd --uid 1000 --gid corelasi --create-home corelasi

WORKDIR /app

COPY corelasi-backend/requirements.lock /tmp/requirements.lock
RUN python -m pip install --no-cache-dir --requirement /tmp/requirements.lock

COPY --chown=corelasi:corelasi corelasi-backend/ /app/
RUN mkdir -p /app/logs /app/media /app/staticfiles \
    && chown -R corelasi:corelasi /app

USER corelasi

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD python -c "import urllib.request; request = urllib.request.Request('http://127.0.0.1:8000/api/health/ready/', headers={'Host': 'localhost', 'X-Forwarded-Proto': 'https'}); raise SystemExit(0 if urllib.request.urlopen(request, timeout=3).status == 200 else 1)"

CMD ["python", "-m", "waitress", "--listen=0.0.0.0:8000", "--url-scheme=https", "--threads=8", "--connection-limit=100", "--channel-timeout=30", "--max-request-header-size=65536", "--max-request-body-size=12582912", "config.wsgi:application"]
