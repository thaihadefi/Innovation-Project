FROM node:24.0.0-alpine AS build

WORKDIR /app
COPY package.json yarn.lock ./

RUN corepack enable
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 3069

USER root

CMD ["yarn", "dev"]

