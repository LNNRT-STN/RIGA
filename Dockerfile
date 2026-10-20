# One container for the whole KBC Trust demo: the Python server serves the API and the built app.
# Cloud Run builds this from the repository root and sends traffic to $PORT.

FROM node:22-slim AS frontend
WORKDIR /app/src/frontend
COPY src/frontend/package.json src/frontend/package-lock.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY src/backend/requirements.txt src/backend/
RUN pip install --no-cache-dir -r src/backend/requirements.txt
COPY src/backend/ src/backend/
COPY src/frontend/public/demo/ src/frontend/public/demo/
COPY --from=frontend /app/src/frontend/dist/ /app/static/
ENV HOST=0.0.0.0 \
    PORT=8080 \
    STATIC_DIR=/app/static \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python3", "src/backend/server.py"]
