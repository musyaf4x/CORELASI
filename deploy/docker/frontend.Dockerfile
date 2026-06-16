FROM node:22-alpine AS build

WORKDIR /app

COPY corelasi-frontend/package.json corelasi-frontend/package-lock.json ./
RUN npm ci

COPY corelasi-frontend/ ./

ARG VITE_API_BASE_URL=/api
ARG VITE_ENABLE_DEMO_LOGIN=false
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ENABLE_DEMO_LOGIN=${VITE_ENABLE_DEMO_LOGIN}

RUN npm run build

FROM caddy:2-alpine

RUN setcap -r /usr/bin/caddy

COPY deploy/Caddyfile.container /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/api/health/live/ || exit 1
