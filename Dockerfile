FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "build"]