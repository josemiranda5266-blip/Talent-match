FROM oven/bun:1.4.2 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.4.2-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --production --no-save
COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["bun", "dist/server.cjs"]
