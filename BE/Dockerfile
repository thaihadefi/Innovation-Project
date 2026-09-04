FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 4001

CMD ["node", "dist/index.js"]
