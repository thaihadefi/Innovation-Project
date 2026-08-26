FROM node:22.15.1-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY . .

RUN yarn add ts-node typescript @types/node

EXPOSE 4001

CMD ["yarn", "start"]
