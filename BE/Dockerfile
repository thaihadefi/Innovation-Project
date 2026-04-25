FROM node:22.15.1-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

# Copy all source code
COPY . .

# Install ts-node globally to run .ts files in production if needed, or use the local one
RUN yarn add ts-node typescript @types/node

EXPOSE 4001

# Chạy bằng ts-node để đảm bảo tính "thông minh" của dự án (tự nạp .env, tự map đường dẫn)
CMD ["yarn", "start"]
