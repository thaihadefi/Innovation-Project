FROM node:24.0.0-alpine AS build

WORKDIR /app
COPY package.json yarn.lock ./

RUN corepack enable
RUN yarn install --frozen-lockfile

COPY . .

# Build the application
RUN yarn build

EXPOSE 3069

CMD ["yarn", "next", "start", "--port", "3069"]
