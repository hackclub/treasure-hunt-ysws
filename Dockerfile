FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
RUN corepack enable
RUN corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG HCA_CLIENT_ID
ARG HCA_CLIENT_SECRET
ARG HCA_REDIRECT_ADDRESS
ENV HCA_CLIENT_ID=${HCA_CLIENT_ID}
ENV HCA_CLIENT_SECRET=${HCA_CLIENT_SECRET}
ENV HCA_REDIRECT_ADDRESS=${HCA_REDIRECT_ADDRESS}
RUN corepack enable
RUN corepack prepare pnpm@10.33.2 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "build"]