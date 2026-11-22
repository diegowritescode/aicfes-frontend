# syntax=docker/dockerfile:1

# The web target of the React Native app, served as static files.
#
# Same output shape as the Vite build it replaces — a folder of assets
# behind nginx — so the nginx config, the headers and the compose
# service carry over unchanged. What changes is who produces the
# folder: Metro rather than Vite, from the same source that builds the
# Android app.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The API origin is baked in at build time: a static bundle has no
# server to read configuration from, so the image is per-environment.
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export --platform web

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
EXPOSE 8080
