FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY . .
RUN yarn build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build /usr/share/caddy
