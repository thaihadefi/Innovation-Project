FROM node:22.15.1-alpine AS build

WORKDIR /app
COPY package.json yarn.lock ./

RUN corepack enable
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 4001

USER root

CMD ["yarn", "start"]

